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
  recordLabel?: (record: T) => string;
}

const IRREVERSIBLE = "Das lässt sich nicht rückgängig machen.";

function defaultMessage<T>(records: T[], recordLabel?: (record: T) => string) {
  if (records.length > 1) return `${records.length} Einträge werden gelöscht. ${IRREVERSIBLE}`;
  return recordLabel
    ? `„${recordLabel(records[0])}“ wird gelöscht. ${IRREVERSIBLE}`
    : `Der Eintrag wird gelöscht. ${IRREVERSIBLE}`;
}

export function DeleteModal<T extends BaseEntity>({
  queryKey,
  connectedQueryKeys,
  apiPath,
  onClose,
  selectedRecords,
  confirmMessage,
  recordLabel,
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

      <Text component="div" size="sm">
        {confirmMessage ? confirmMessage(records) : defaultMessage(records, recordLabel)}
      </Text>
      <Group mt="md" justify="flex-end" gap="xs">
        <Button onClick={onClose} variant="default" disabled={isDeleting}>
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
