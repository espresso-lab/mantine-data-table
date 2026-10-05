import { ActionIcon, Group, HoverCard, Stack, Text, Title, TitleOrder } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import React from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Crumb, useBreadcrumbTrail } from "./breadcrumbContext";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  hint?: React.ReactNode;
  breadcrumbs?: Crumb[];
  crumb?: React.ReactNode;
  actions?: React.ReactNode;
  order?: TitleOrder;
}

export function PageHeader({
  title,
  description,
  badge,
  hint,
  breadcrumbs = [],
  crumb,
  actions,
  order = 2,
}: PageHeaderProps) {
  const outer = useBreadcrumbTrail();
  const current = crumb ?? (typeof title === "string" ? title : null);
  const trail: Crumb[] = [...outer, ...breadcrumbs, ...(current != null ? [{ label: current }] : [])];

  return (
    <Stack gap="xs">
      {order <= 2 && <Breadcrumbs trail={trail} />}
      <Group justify="space-between" align={description ? "flex-end" : "center"} wrap="wrap" gap="md">
        <Stack gap={4} miw={0}>
          <Group gap="xs" wrap="wrap">
            {typeof title === "string" ? <Title order={order}>{title}</Title> : title}
            {hint != null && (
              <HoverCard width={340} shadow="md" withArrow openDelay={120} closeDelay={160} position="top-start" events={{ touch: true }}>
                <HoverCard.Target>
                  <ActionIcon variant="subtle" color="gray" radius="xl" aria-label="Mehr Informationen">
                    <IconInfoCircle size={16} />
                  </ActionIcon>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <Text component="div" size="sm" c="dimmed">
                    {hint}
                  </Text>
                </HoverCard.Dropdown>
              </HoverCard>
            )}
            {badge}
          </Group>
          {description != null && (
            <Text component="div" size="sm" c="dimmed">
              {description}
            </Text>
          )}
        </Stack>
        {actions && (
          <Group gap="xs" wrap="wrap">
            {actions}
          </Group>
        )}
      </Group>
    </Stack>
  );
}
