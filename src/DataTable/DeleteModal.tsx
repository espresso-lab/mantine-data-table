import { Alert, Button, Group, Text } from "@mantine/core";
import { BaseEntity, useDeleteOne } from "../Hooks/useApi";
import { ReactNode, useEffect, useState } from "react";

export interface DeleteModalProps<T> {
  onClose: () => void;
  queryKey: (string | number)[];
  connectedQueryKeys?: (string | number)[][];
  apiPath: string;
  selectedRecords: T[];
  confirmMessage?: (records: T[]) => ReactNode;
}

export function DeleteModal<T extends BaseEntity>({
  queryKey,
  connectedQueryKeys,
  apiPath,
  onClose,
  selectedRecords,
  confirmMessage,
}: DeleteModalProps<T>) {
  const {
    mutateAsync: del,
    isError: isDeleteError,
    error: deleteError,
    isPending: isDeletePending,
  } = useDeleteOne(apiPath, queryKey, connectedQueryKeys);

  const [records, setRecords] = useState<T[]>(selectedRecords);
  const [isDeleting, setIsDeleting] = useState(false);
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
        {confirmMessage
          ? confirmMessage(records)
          : records.length === 1
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
