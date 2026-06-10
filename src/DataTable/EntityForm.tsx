import { Alert, Button, Checkbox, Group, NumberInput, Stepper, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
// @ts-expect-error - FormRule not publicly exported from @mantine/form
import type { FormRule } from "@mantine/form/lib/types";
import { Fragment, useEffect, useState } from "react";
import { BaseEntity, getFieldViolations } from "../Hooks/useApi";
import { Field, StepConfig } from "./DataTable.tsx";

function resolveRequired<T>(field: Field<T>, values: Partial<T>): boolean {
  return typeof field.required === "function" ? field.required(values) : !!field.required;
}

function buildInitialValues<T>(fields: Field<T>[]): T {
  return fields.reduce((acc, field) => {
    acc[field.id as keyof T] =
      field.type === "boolean"
        ? (field.defaultValue ?? (false as T[keyof T]))
        : (field.defaultValue ?? ("" as T[keyof T]));
    return acc;
  }, {} as T);
}

function buildValidation<T>(fields: Field<T>[]) {
  return fields
    .filter((field) => field.required)
    .reduce(
      (acc, field) => {
        acc[field.id as keyof T] = (value: never, values: T) => {
          if (field.conditional && !field.conditional(values)) return null;
          if (!resolveRequired(field, values)) return null;
          return value ? null : "Pflichtfeld";
        };
        return acc;
      },
      {} as Partial<{ [Key in keyof T]: FormRule<T[Key], T> }>,
    );
}

function cleanValues<T>(rawValues: T): T {
  return Object.fromEntries(
    Object.entries(rawValues as Record<string, unknown>).map(([key, value]) => [key, value === "" ? undefined : value]),
  ) as T;
}

function normalizeLoadedValues<T>(data: T, fields: Field<T>[]): T {
  const values = { ...data };
  fields.forEach((field) => {
    const key = field.id as keyof T;
    if (field.type === "boolean" && values[key] === null) {
      values[key] = false as T[keyof T];
    } else if (field.type === "date" && values[key]) {
      values[key] = new Date(values[key] as unknown as string) as unknown as T[keyof T];
    } else if (values[key] === null) {
      values[key] = "" as T[keyof T];
    }
  });
  return values;
}

const violationFieldId = (path: string) => path.split(".").pop() ?? path;

function mapFieldViolations(error: unknown, fieldIds: Set<string>): Record<string, string> {
  return Object.fromEntries(
    (getFieldViolations(error) ?? [])
      .filter((violation) => fieldIds.has(violationFieldId(violation.field)))
      .map((violation) => [violationFieldId(violation.field), violation.message]),
  );
}

function resolveGeneralError(error: Error | null | undefined, fieldIds: Set<string>): string | undefined {
  const violations = getFieldViolations(error);
  if (!violations) return error?.message;
  const unmapped = violations.filter((violation) => !fieldIds.has(violationFieldId(violation.field)));
  return unmapped.length > 0 ? unmapped.map((violation) => violation.message).join(", ") : undefined;
}

export interface EntityFormProps<T extends BaseEntity> {
  fields: Field<T>[];
  steps?: StepConfig[];
  record?: T;
  recordId?: string | number;
  submitting: boolean;
  error?: Error | null;
  onPersist: (values: T) => Promise<void>;
  onClose: () => void;
}

export function EntityForm<T extends BaseEntity>({
  fields,
  steps,
  record,
  recordId,
  submitting,
  error,
  onPersist,
  onClose,
}: EntityFormProps<T>) {
  const [active, setActive] = useState(0);
  const [hideButtons, setHideButtons] = useState(false);

  const form = useForm<T>({
    mode: "uncontrolled",
    initialValues: buildInitialValues(fields),
    validate: buildValidation(fields),
  });

  useEffect(() => {
    if (record) {
      const values = normalizeLoadedValues(record, fields);
      form.initialize(values);
      form.setValues(values);
    }
  }, [record]);

  const fieldIds = new Set(fields.map((f) => String(f.id)));
  const generalError = resolveGeneralError(error, fieldIds);

  const stepsAvailable = [...new Set(fields.filter((f) => typeof f.step === "number").map((f) => f.step as number))];
  const hasSteps = stepsAvailable.length > 0;
  const isLastStep = active === stepsAvailable.length - 1;

  function renderField(field: Field<T>) {
    const values = form.getValues();
    if (field.conditional && !field.conditional(values)) return null;
    const required = resolveRequired(field, values);
    const inputProps = form.getInputProps(field.id as string);

    switch (field.type) {
      case "number":
        return <NumberInput key={form.key(field.id)} decimalSeparator="," thousandSeparator="." label={field.column.title} placeholder={field.placeholder ?? ""} required={required} {...inputProps} />;
      case "date":
        return <DateInput key={form.key(field.id)} valueFormat="DD.MM.YYYY" clearable label={field.column.title} placeholder={field.placeholder ?? ""} required={required} {...inputProps} />;
      case "boolean":
        return <Checkbox key={form.key(field.id)} mt="md" label={field.column.title} required={required} {...form.getInputProps(field.id as string, { type: "checkbox" })} />;
      case "textarea":
        return <Textarea key={form.key(field.id)} minRows={3} autosize label={field.column.title} placeholder={field.placeholder ?? ""} required={required} {...inputProps} />;
      case "custom":
        return field.render?.(
          { ...values, ...(recordId != null && { id: recordId }) } as T,
          form.setValues,
          setHideButtons,
          { error: inputProps.error, required },
        );
      default:
        return <TextInput key={form.key(field.id)} type={field.id.includes("email") ? "email" : undefined} label={field.column.title} placeholder={field.placeholder ?? ""} required={required} {...inputProps} />;
    }
  }

  const fieldsToRender = (step?: number) =>
    (step === undefined ? fields : fields.filter((f) => f.step === step)).map((field) => (
      <Fragment key={field.id}>{renderField(field)}</Fragment>
    ));

  return (
    <>
      {generalError && (
        <Alert variant="outline" color="red" title="Fehler aufgetreten" mb="lg">
          {generalError}
        </Alert>
      )}

      <form
        onSubmit={form.onSubmit(async (raw) => {
          const values = cleanValues(raw as T);
          try {
            await onPersist(values);
          } catch (submitError) {
            const fieldErrors = mapFieldViolations(submitError, fieldIds);
            if (Object.keys(fieldErrors).length > 0) form.setErrors(fieldErrors);
            return;
          }
          if (hasSteps && !isLastStep) {
            setActive((current) => current + 1);
          } else {
            form.setInitialValues(values);
            form.reset();
            onClose();
          }
        })}
      >
        {hasSteps ? (
          <Stepper active={active} size="sm">
            {stepsAvailable.map((step) => (
              <Stepper.Step key={step} {...(steps?.[step - 1] ? { label: steps[step - 1].label } : {})}>
                {fieldsToRender(step)}
              </Stepper.Step>
            ))}
          </Stepper>
        ) : (
          fieldsToRender()
        )}

        {!hideButtons && (
          <Group mt="md" justify="end">
            <Button variant="outline" onClick={() => (hasSteps && active > 0 ? setActive((current) => current - 1) : onClose())}>
              {hasSteps && active > 0 ? "Zurück" : "Abbrechen"}
            </Button>
            <Button type="submit" loading={submitting}>
              {hasSteps && !isLastStep ? "Weiter" : "Speichern"}
            </Button>
          </Group>
        )}
      </form>
    </>
  );
}
