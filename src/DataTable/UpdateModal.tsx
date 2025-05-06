import {
  Alert,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Skeleton,
  Stack,
  Stepper,
  TextInput,
} from "@mantine/core";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { BaseEntity, useGetOne, useUpdateOne } from "../Hooks/useApi";
import { Field, StepConfig } from "./DataTableInner.tsx";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import type { FormRule } from "@mantine/form/lib/types";
import { DateInput } from "@mantine/dates";

interface UpdateModalProps<T> {
  fields: Field<T>[];
  steps?: StepConfig[];
  onClose: () => void;
  queryKey: (string | number)[];
  apiPath: string;
  id: string | number;
}

export function UpdateModal<T extends BaseEntity>({
  fields,
  onClose,
  queryKey,
  apiPath,
  id,
  steps,
}: UpdateModalProps<T>) {
  const [active, setActive] = useState<number>(0);
  const [hideButtons, setHideButtons] = useState<boolean>(false);

  const { data, isLoading: isDataLoading } = useGetOne<T>(
    apiPath,
    queryKey,
    id,
  );
  const {
    mutateAsync: update,
    isError: isUpdateError,
    error: updateError,
    isPending,
  } = useUpdateOne<T>(apiPath, queryKey);

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
          ? (field.defaultValue ?? (false as T[keyof T]))
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

  useEffect(() => {
    if (data) {
      const values = fields.reduce((acc, field) => {
        const key = field.id as keyof T;
        acc[key] = Array.isArray(data[key])
          ? data[key]
          : field.type === "boolean"
            ? (data[key] ?? (false as T[keyof T]))
            : field.type === "date"
              ? data[key]
                ? (new Date(
                    data[key] as unknown as string,
                  ) as unknown as T[keyof T])
                : ("" as T[keyof T])
              : (data[key] ?? ("" as T[keyof T]));
        return acc;
      }, {} as T);
      form.initialize(values);
      form.setValues(values);
    }
  }, [data]);

  function renderField(field: Field<T>) {
    return (
      <Fragment key={field.id}>
        {(field.type === undefined || field.type == "text") && (
          <TextInput
            label={field.column.title}
            key={form.key(field.id)}
            placeholder={field.placeholder ?? ""}
            {...form.getInputProps(field.id as string)}
            type={field.id.includes("email") ? "email" : undefined}
          />
        )}

        {field.type === "number" && (
          <NumberInput
            decimalSeparator=","
            label={field.column.title}
            placeholder={field.placeholder ?? ""}
            key={form.key(field.id)}
            {...form.getInputProps(field.id as string)}
          />
        )}

        {field.type === "date" && (
          <DateInput
            label={field.column.title}
            placeholder={field.placeholder ?? ""}
            key={form.key(field.id)}
            valueFormat={"DD.MM.YYYY"}
            clearable
            {...form.getInputProps(field.id as string)}
          />
        )}

        {field.type === "boolean" && (
          <Checkbox
            mt="md"
            label={field.column.title}
            key={form.key(field.id)}
            {...form.getInputProps(field.id as string, { type: "checkbox" })}
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
      {isUpdateError && (
        <Alert
          variant="outline"
          color="red"
          title={updateError?.name ?? "Fehler aufgetreten"}
          mb="lg"
        >
          {updateError?.message ?? "Fehler aufgetreten"}
        </Alert>
      )}

      {isDataLoading ? (
        <Stack gap="md">
          <Skeleton height={40} />
          {Array(fields.length)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={`skeleton-field-${index}`} height={35} />
            ))}
          <Group mt="md" justify="end">
            <Skeleton width={100} height={36} />
            <Skeleton width={100} height={36} />
          </Group>
        </Stack>
      ) : (
        <form
          onSubmit={form.onSubmit(async (values) => {
            await update({
              ...values,
              id,
            } as T);
            if (stepsAvailable.length && active < stepsAvailable.length - 1) {
              if (!isUpdateError) {
                setActive(active + 1);
              }
            } else {
              if (!isUpdateError) {
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
      )}
    </>
  );
}
