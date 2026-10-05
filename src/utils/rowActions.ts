import type { RowActionsProps } from "../DataTable/RowActions";

export const hasRowActions = ({ actions = [], onEdit, onDelete }: RowActionsProps) =>
  !!onEdit || !!onDelete || actions.length > 0;
