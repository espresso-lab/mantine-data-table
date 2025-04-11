import { Alert, Button, Group, Text } from "@mantine/core";
import { BaseEntity, useDeleteOne } from "../Hooks/useApi";
import { useEffect, useState } from "react";

interface DeleteModalProps<T> {
  onClose: () => void;
  queryKey: (string | number)[];
  apiPath: string;
  selectedRecords: T[];
}

export function DeleteModal<T extends BaseEntity>({
  queryKey,
  apiPath,
  onClose,
  selectedRecords,
}: DeleteModalProps<T>) {
  const {
    mutateAsync: del,
    isError: isDeleteError,
    error: deleteError,
    isPending: isDeletePending,
  } = useDeleteOne(apiPath, queryKey);

  const [records, setRecords] = useState<T[]>(selectedRecords);

  useEffect(() => {
    if (!records.length) {
      onClose();
    }
  }, [onClose, records]);

  if (!records.length) {
    return <></>;
  }

  return (
    <>
      {isDeleteError && deleteError.message && (
        <Alert variant="outline" color="red" title={deleteError.name}>
          {deleteError.message}
        </Alert>
      )}

      <Text>
        Bist du sicher, dass du folgenden Eintrag löschen möchtest?
        <br />
        {selectedRecords[0].id}
      </Text>
      <Group mt="md" justify="end">
        <Button onClick={onClose} variant="outline">
          Abbrechen
        </Button>
        <Button
          color="red"
          loading={isDeletePending}
          onClick={async () => {
            await del(records[0].id);
            setRecords((r) =>
              r.filter((record) => record.id !== records[0].id),
            );
          }}
        >
          Delete
        </Button>
      </Group>
    </>
  );
}
