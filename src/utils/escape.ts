import type { KeyboardEvent } from "react";

export function isOwnEscape(event: KeyboardEvent): boolean {
  return (
    event.key === "Escape" &&
    !event.nativeEvent.isComposing &&
    !(event.target instanceof HTMLElement && event.target.dataset.mantineStopPropagation === "true")
  );
}
