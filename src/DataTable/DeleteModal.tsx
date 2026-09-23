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
  const { mutateAsync: del } = useDeleteOne(apiPath, queryKey, connectedQueryKeys);

  const [records, setRecords] = useState<T[]>(selectedRecords);
  const [failures, setFailures] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

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
      {failures.length > 0 && (
        <Alert
          variant="outline"
          color="red"
          mb="sm"
          title={
            records.length === 1
              ? "1 Eintrag wurde nicht gelöscht"
              : `${records.length} Einträge wurden nicht gelöscht`
          }
        >
          {failures.map((failure) => (
            <Text key={failure} size="sm">
              {failure}
            </Text>
          ))}
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
        <Button onClick={onClose} variant="outline" disabled={isDeleting}>
          Abbrechen
        </Button>
        <Button
          color="red"
          loading={isDeleting}
          onClick={async () => {
            setIsDeleting(true);
            const results = await Promise.allSettled(
              records.map((record) => del(record.id)),
            );
            const reasons = results.flatMap((result) =>
              result.status === "rejected" ? [result.reason] : [],
            );
            setRecords(
              records.filter((_, index) => results[index].status === "rejected"),
            );
            setFailures([
              ...new Set(
                reasons.map((reason) =>
                  reason instanceof Error ? reason.message : String(reason),
                ),
              ),
            ]);
            setIsDeleting(false);
          }}
        >
          Löschen
        </Button>
      </Group>
    </>
  );
}
