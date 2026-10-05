import { Group, Skeleton, Stack } from "@mantine/core";
import { BaseEntity, useGetOne, useUpdateOne, useUpdateWith } from "../Hooks/useApi";
import { Field, StepConfig } from "./DataTable.tsx";
import { EntityForm } from "./EntityForm.tsx";

export interface UpdateModalProps<T> {
  fields: Field<T>[];
  steps?: StepConfig[];
  onClose: () => void;
  queryKey: (string | number)[];
  connectedQueryKeys?: (string | number)[][];
  apiPath: string;
  id: string | number;
  record?: T;
  onUpdate?: (values: T) => Promise<unknown>;
}

export function UpdateModal<T extends BaseEntity>({
  fields,
  onClose,
  queryKey,
  connectedQueryKeys,
  apiPath,
  id,
  steps,
  record,
  onUpdate,
}: UpdateModalProps<T>) {
  const fetched = useGetOne<T>(apiPath, queryKey, onUpdate ? undefined : id);
  const standard = useUpdateOne<T>(apiPath, queryKey, connectedQueryKeys);
  const custom = useUpdateWith<T>((values) => onUpdate?.(values) ?? Promise.resolve(), queryKey, connectedQueryKeys);
  const data = onUpdate ? record : fetched.data;
  const mutation = onUpdate ? custom : standard;

  if (!data) {
    return (
      <Stack gap="md">
        <Skeleton height={40} />
        {Array.from({ length: fields.length }).map((_, index) => (
          <Skeleton key={index} height={35} />
        ))}
        <Group mt="md" justify="end">
          <Skeleton width={100} height={36} />
          <Skeleton width={100} height={36} />
        </Group>
      </Stack>
    );
  }

  const persist = async (values: T) => {
    await mutation.mutateAsync({ ...values, id });
  };

  return (
    <EntityForm
      fields={fields}
      steps={steps}
      record={data}
      recordId={id}
      submitting={mutation.isPending}
      error={mutation.error}
      submitLabel="Speichern"
      onPersist={persist}
      onClose={onClose}
    />
  );
}
