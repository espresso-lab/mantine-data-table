import { ActionIcon, Anchor, Breadcrumbs as MantineBreadcrumbs, Menu, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconChevronRight, IconDots } from "@tabler/icons-react";
import React from "react";
import { BreadcrumbContext, Crumb, useBreadcrumbTrail } from "./breadcrumbContext";

const VISIBLE_ON_MOBILE = 2;

export function BreadcrumbProvider({ trail, children }: { trail: Crumb[]; children: React.ReactNode }) {
  const outer = useBreadcrumbTrail();
  return <BreadcrumbContext.Provider value={[...outer, ...trail]}>{children}</BreadcrumbContext.Provider>;
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const mobile = useMediaQuery("(max-width: 48em)", false, { getInitialValueInEffect: false });
  const collapsed = mobile && trail.length > VISIBLE_ON_MOBILE ? trail.slice(0, -VISIBLE_ON_MOBILE) : [];
  const visible = trail.slice(collapsed.length);

  return (
    <MantineBreadcrumbs
      role="navigation"
      aria-label="Sie sind hier"
      separator={<IconChevronRight size={14} />}
      separatorMargin={6}
      styles={{ root: { flexWrap: "nowrap" } }}
    >
      {collapsed.length > 0 && (
        <Menu position="bottom-start">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label="Übergeordnete Seiten">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {collapsed.map((crumb, index) => (
              <Menu.Item key={index} disabled={!crumb.onClick} onClick={crumb.onClick}>
                {crumb.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}
      {visible.map((crumb, index) =>
        index < visible.length - 1 && crumb.onClick ? (
          <Anchor key={index} component="button" type="button" size="sm" lh="sm" c="dimmed" miw={0} truncate onClick={crumb.onClick}>
            {crumb.label}
          </Anchor>
        ) : (
          <Text
            key={index}
            size="sm"
            lh="sm"
            c={index < visible.length - 1 ? "dimmed" : undefined}
            miw={0}
            truncate
            aria-current={index === visible.length - 1 ? "page" : undefined}
          >
            {crumb.label}
          </Text>
        ),
      )}
    </MantineBreadcrumbs>
  );
}
