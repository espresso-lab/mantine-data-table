import {
  Alert,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Stepper,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { BaseEntity, useAddOne, useUpdateOne } from "../Hooks/useApi";
import { Field, StepConfig } from "./DataTableInner.tsx";
import { Fragment, useState } from "react"; // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import type { FormRule } from "@mantine/form/lib/types";
import { DateInput } from "@mantine/dates";

export interface CreateModalProps<T> {
  fields: Field<T>[];
  onClose: () => void;
  queryKey: (string | number)[];
  apiPath: string;
  steps?: StepConfig[];
  onCreated?: (id: string | number) => void;
}

export function CreateModal<T extends BaseEntity>({
  fields,
  onClose,
  queryKey,
  apiPath,
  steps,
  onCreated,
}: CreateModalProps<T>) {
  const [active, setActive] = useState(0);
  const [hideButtons, setHideButtons] = useState<boolean>(false);
  const [recordId, setRecordId] = useState<string | number>();

  const {
    mutateAsync: create,
    isError: isCreateError,
    error: createError,
    isPending: isCreatePending,
  } = useAddOne<T>(apiPath, queryKey);
  const { mutateAsync: update, isPending: isUpdatePending } = useUpdateOne<T>(
    apiPath,
    queryKey,
  );

  const isPending = isCreatePending || isUpdatePending;

  const stepsAvailable = [
    ...new Set(
      fields
        .filter((f) => typeof f.step === "number")
        .map((f) => f.step as number),
    ),
  ];

  const form = useForm({
    mode: "uncontrolled",
    initialValues: fields.reduce((acc, field) => {
      acc[field.id as keyof T] =
        field.type === "boolean"
          ? (false as T[keyof T])
          : (field.defaultValue ?? ("" as T[keyof T]));
      return acc;
    }, {} as T),
    validate: fields
      .filter((field) => field.required)
      .reduce(
        (acc, field) => {
          acc[field.id as keyof T] = (value: never) =>
            value ? null : "Pflichtfeld";
          return acc;
        },
        {} as Partial<{ [Key in keyof T]: FormRule<T[Key], T> }>,
      ),
  });

  function renderField(field: Field<T>) {
    return (
      <Fragment key={field.id}>
        {(field.type === undefined || field.type == "text") && (
          <TextInput
            label={field.column.title}
            key={form.key(field.id)}
            placeholder={field.placeholder ?? ""}
            {...form.getInputProps(field.id as keyof T)}
            type={field.id.includes("email") ? "email" : undefined}
          />
        )}

        {field.type === "number" && (
          <NumberInput
            decimalSeparator=","
            label={field.column.title}
            placeholder={field.placeholder ?? ""}
            key={form.key(field.id)}
            {...form.getInputProps(field.id as keyof T)}
          />
        )}

        {field.type === "date" && (
          <DateInput
            label={field.column.title}
            placeholder={field.placeholder ?? ""}
            key={form.key(field.id)}
            valueFormat={"DD.MM.YYYY"}
            clearable
            {...form.getInputProps(field.id as keyof T)}
          />
        )}

        {field.type === "boolean" && (
          <Checkbox
            mt="md"
            label={field.column.title}
            key={form.key(field.id)}
            {...form.getInputProps(field.id as keyof T, { type: "checkbox" })}
          />
        )}

        {field.type === "custom" &&
          field.render &&
          field.render(form.getValues() as T, form.setValues, setHideButtons)}
      </Fragment>
    );
  }

  return (
    <>
      {isCreateError && (
        <Alert
          variant="outline"
          color="red"
          title={createError?.name ?? "Fehler aufgetreten"}
          mb="lg"
        >
          {createError?.message ?? "Fehler aufgetreten"}
        </Alert>
      )}

      <form
        onSubmit={form.onSubmit(async (values) => {
          if (recordId) {
            await update({ ...values, id: recordId } as T);
          } else {
            const result = await create(values as T);
            setRecordId(result.id);
            onCreated?.(result.id);
          }

          if (stepsAvailable.length && active < stepsAvailable.length - 1) {
            if (!isCreateError) {
              setActive(active + 1);
            }
          } else {
            if (!isCreateError) {
              form.setInitialValues(values);
              form.reset();
              onClose();
            }
          }
        })}
      >
        {stepsAvailable.length ? (
          <Stepper active={active} size="sm">
            {stepsAvailable.map((step) => (
              <Stepper.Step
                key={step}
                {...(steps && steps[step - 1]
                  ? { label: steps[step - 1].label }
                  : {})}
              >
                {fields
                  .filter((f) => f.step === step)
                  .map((field) => renderField(field))}
              </Stepper.Step>
            ))}
          </Stepper>
        ) : (
          fields.map((field) => renderField(field))
        )}
        {!hideButtons && (
          <Group mt="md" justify="end">
            <Button
              onClick={() =>
                stepsAvailable.length
                  ? active === 0
                    ? onClose()
                    : setActive(active - 1)
                  : onClose()
              }
              variant="outline"
            >
              {stepsAvailable.length
                ? active === 0
                  ? "Abbrechen"
                  : "Zurück"
                : "Abbrechen"}
            </Button>
            <Button type="submit" loading={isPending}>
              {stepsAvailable.length
                ? active === stepsAvailable.length - 1
                  ? "Speichern"
                  : "Weiter"
                : "Speichern"}
            </Button>
          </Group>
        )}
      </form>
    </>
  );
}
