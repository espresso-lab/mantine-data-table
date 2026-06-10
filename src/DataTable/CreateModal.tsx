import { useState } from "react";
import { BaseEntity, useAddOne, useUpdateOne } from "../Hooks/useApi";
import { Field, StepConfig } from "./DataTable.tsx";
import { EntityForm } from "./EntityForm.tsx";

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
  const [recordId, setRecordId] = useState<string | number>();

  const { mutateAsync: create, isPending: isCreating, error: createError } = useAddOne<T>(apiPath, queryKey);
  const { mutateAsync: update, isPending: isUpdating, error: updateError } = useUpdateOne<T>(apiPath, queryKey);

  const persist = async (values: T) => {
    if (recordId != null) {
      await update({ ...values, id: recordId });
    } else {
      const created = await create(values);
      setRecordId(created.id);
      onCreated?.(created.id);
    }
  };

  return (
    <EntityForm
      fields={fields}
      steps={steps}
      recordId={recordId}
      submitting={isCreating || isUpdating}
      error={createError ?? updateError}
      onPersist={persist}
      onClose={onClose}
    />
  );
}
