import { ActionIcon, Group, MantineColor, Menu, Tooltip } from "@mantine/core";
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import React from "react";
import { hasRowActions } from "../utils/rowActions";

export interface RowAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: MantineColor;
  disabled?: boolean;
  loading?: boolean;
}

export interface RowActionsProps {
  name?: string;
  actions?: RowAction[];
  onEdit?: () => void;
  onDelete?: () => void;
}

const MAX_VISIBLE_ACTIONS = 2;

const describe = (label: string, name?: string) => (name ? `${label}: ${name}` : label);

function RowActionIcon({ action, name }: { action: RowAction; name?: string }) {
  return (
    <Tooltip label={action.label}>
      <ActionIcon
        variant="subtle"
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

export function RowActions({ name, actions = [], onEdit, onDelete }: RowActionsProps) {
  const collapsed = actions.length > MAX_VISIBLE_ACTIONS;

  return (
    <Group gap={4} justify="flex-end" wrap="nowrap" onClick={(event) => event.stopPropagation()}>
      {collapsed ? (
        <Menu>
          <Menu.Target>
            <Tooltip label="Weitere Aktionen">
              <ActionIcon variant="subtle" color="gray" aria-label={describe("Weitere Aktionen", name)}>
                <IconDots size={16} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            {actions.map((action) => (
              <Menu.Item
                key={action.label}
                leftSection={action.icon}
                color={action.color}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      ) : (
        actions.map((action) => <RowActionIcon key={action.label} action={action} name={name} />)
      )}
      {onEdit && (
        <RowActionIcon action={{ label: "Bearbeiten", icon: <IconPencil size={16} />, onClick: onEdit }} name={name} />
      )}
      {onDelete && (
        <RowActionIcon
          action={{ label: "Löschen", icon: <IconTrash size={16} />, color: "red", onClick: onDelete }}
          name={name}
        />
      )}
    </Group>
  );
}

export function RowActionsMenu({ name, actions = [], onEdit, onDelete }: RowActionsProps) {
  if (!hasRowActions({ actions, onEdit, onDelete })) return null;
  return (
    <Menu>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={describe("Weitere Aktionen", name)}
          onClick={(event: React.MouseEvent) => event.stopPropagation()}
        >
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown onClick={(event: React.MouseEvent) => event.stopPropagation()}>
        {onEdit && (
          <Menu.Item leftSection={<IconPencil size={16} />} onClick={onEdit}>
            Bearbeiten
          </Menu.Item>
        )}
        {actions.map((action) => (
          <Menu.Item
            key={action.label}
            leftSection={action.icon}
            color={action.color}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Menu.Item>
        ))}
        {onDelete && (onEdit || actions.length > 0) && <Menu.Divider />}
        {onDelete && (
          <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={onDelete}>
            Löschen
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
