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

  const { mutateAsync: create, isPending: isCreating, error } = useAddOne<T>(apiPath, queryKey);
  const { mutateAsync: update, isPending: isUpdating } = useUpdateOne<T>(apiPath, queryKey);

  const persist = async (values: T): Promise<boolean> => {
    try {
      if (recordId != null) {
        await update({ ...values, id: recordId });
      } else {
        const created = await create(values);
        setRecordId(created.id);
        onCreated?.(created.id);
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <EntityForm
      fields={fields}
      steps={steps}
      recordId={recordId}
      submitting={isCreating || isUpdating}
      error={error}
      onPersist={persist}
      onClose={onClose}
    />
  );
}
