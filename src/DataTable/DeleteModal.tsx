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
  const [isDeleting, setIsDeleting] = useState(false);

  // Combined loading state for clean usage
  const isLoading = isDeleting || isDeletePending;

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
        {records.length === 1
          ? `Soll ${records.length} Eintrag wirklich gelöscht werden?`
          : `Sollen ${records.length} Einträge wirklich gelöscht werden?`}
      </Text>
      <Group mt="md" justify="end">
        <Button onClick={onClose} variant="outline" disabled={isLoading}>
          Abbrechen
        </Button>
        <Button
          color="red"
          loading={isLoading}
          onClick={async () => {
            setIsDeleting(true);
            try {
              await Promise.all(records.map((record) => del(record.id)));
              setRecords([]);
            } finally {
              setIsDeleting(false);
            }
          }}
        >
          Löschen
        </Button>
      </Group>
    </>
  );
}
