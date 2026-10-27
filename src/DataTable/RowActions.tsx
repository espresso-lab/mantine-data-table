import { ActionIcon, Group, MantineColor, Menu, Tooltip } from "@mantine/core";
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import React, { useRef } from "react";
import { hasRowActions } from "../utils/rowActions";

export interface RowAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: MantineColor;
  variant?: "subtle" | "light";
  disabled?: boolean;
  loading?: boolean;
}

export interface RowActionsProps {
  name?: string;
  actions?: RowAction[];
  onEdit?: () => void;
  editLabel?: string;
  editIcon?: React.ReactNode;
  onDelete?: () => void;
}

const MAX_VISIBLE_ACTIONS = 2;

const describe = (label: string, name?: string) => (name ? `${label}: ${name}` : label);

/** A red action deletes, so it goes where Löschen goes: last, after Bearbeiten and behind a divider. */
const isDestructive = (action: RowAction) => action.color === "red";

function RowActionIcon({ action, name }: { action: RowAction; name?: string }) {
  return (
    <Tooltip label={action.label}>
      <ActionIcon
        variant={action.variant ?? "subtle"}
        color={action.color ?? "gray"}
        disabled={action.disabled}
        loading={action.loading}
        aria-label={describe(action.label, name)}
        onClick={action.onClick}
      >
        {action.icon}
      </ActionIcon>
    </Tooltip>
  );
}

const deleteAction = (onDelete: () => void): RowAction => ({
  label: "Löschen",
  icon: <IconTrash size={16} />,
  color: "red",
  onClick: onDelete,
});

/**
 * The ⋯ of a row or card. An item hands the focus back to the ⋯ before it runs, so a dialog it opens
 * returns the focus there instead of to an item that is gone once the menu has closed.
 */
function ActionsMenu({ name, actions = [], onEdit, editLabel = "Bearbeiten", editIcon, onDelete }: RowActionsProps) {
  const target = useRef<HTMLButtonElement>(null);
  const regular = actions.filter((action) => !isDestructive(action));
  const destructive = [...actions.filter(isDestructive), ...(onDelete ? [deleteAction(onDelete)] : [])];
  const run = (onClick: () => void) => () => {
    target.current?.focus();
    onClick();
  };
  const item = (action: RowAction) => (
    <Menu.Item
      key={action.label}
      leftSection={action.icon}
      color={action.color}
      disabled={action.disabled}
      onClick={run(action.onClick)}
    >
      {action.label}
    </Menu.Item>
  );

  return (
    <Menu>
      <Menu.Target>
        <Tooltip label="Weitere Aktionen">
          <ActionIcon ref={target} variant="subtle" color="gray" aria-label={describe("Weitere Aktionen", name)}>
            <IconDots size={16} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {onEdit && item({ label: editLabel, icon: editIcon ?? <IconPencil size={16} />, onClick: onEdit })}
        {regular.map(item)}
        {destructive.length > 0 && (onEdit || regular.length > 0) && <Menu.Divider />}
        {destructive.map(item)}
      </Menu.Dropdown>
    </Menu>
  );
}

export function RowActions({ name, actions = [], onEdit, editLabel = "Bearbeiten", editIcon, onDelete }: RowActionsProps) {
  const regular = actions.filter((action) => !isDestructive(action));
  const destructive = [...actions.filter(isDestructive), ...(onDelete ? [deleteAction(onDelete)] : [])];

  return (
    <Group gap={4} justify="flex-end" wrap="nowrap" onClick={(event) => event.stopPropagation()}>
      {regular.length > MAX_VISIBLE_ACTIONS ? (
        <ActionsMenu name={name} actions={regular} />
      ) : (
        regular.map((action) => <RowActionIcon key={action.label} action={action} name={name} />)
      )}
      {onEdit && (
        <RowActionIcon action={{ label: editLabel, icon: editIcon ?? <IconPencil size={16} />, onClick: onEdit }} name={name} />
      )}
      {destructive.map((action) => (
        <RowActionIcon key={action.label} action={action} name={name} />
      ))}
    </Group>
  );
}

export function RowActionsMenu({ actions = [], ...props }: RowActionsProps) {
  const statuses = actions.filter((action) => action.variant === "light");
  const menuActions = actions.filter((action) => action.variant !== "light");
  const hasMenu = hasRowActions({ ...props, actions: menuActions });
  if (statuses.length === 0 && !hasMenu) return null;
  return (
    <Group gap={4} justify="flex-end" wrap="nowrap" onClick={(event) => event.stopPropagation()}>
      {statuses.map((action) => (
        <RowActionIcon key={action.label} action={action} name={props.name} />
      ))}
      {hasMenu && <ActionsMenu {...props} actions={menuActions} />}
    </Group>
  );
}
