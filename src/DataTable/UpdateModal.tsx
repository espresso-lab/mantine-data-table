import { Group, Skeleton, Stack } from "@mantine/core";
import { BaseEntity, useGetOne, useUpdateOne } from "../Hooks/useApi";
import { Field, StepConfig } from "./DataTable.tsx";
import { EntityForm } from "./EntityForm.tsx";

export interface UpdateModalProps<T> {
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
  const { data, isLoading } = useGetOne<T>(apiPath, queryKey, id);
  const { mutateAsync: update, isPending, error } = useUpdateOne<T>(apiPath, queryKey);

  if (isLoading || !data) {
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

  const persist = async (values: T): Promise<boolean> => {
    try {
      await update({ ...values, id });
      return true;
    } catch {
      return false;
    }
  };

  return (
    <EntityForm
      fields={fields}
      steps={steps}
      record={data}
      recordId={id}
      submitting={isPending}
      error={error}
      onPersist={persist}
      onClose={onClose}
    />
  );
}
