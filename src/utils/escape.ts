import type { KeyboardEvent } from "react";

export function isOwnEscape(event: KeyboardEvent): boolean {
  const target = event.target instanceof HTMLElement ? event.target : null;
  return (
    event.key === "Escape" &&
    !event.nativeEvent.isComposing &&
    target?.dataset.mantineStopPropagation !== "true" &&
    !(target?.dataset.datesInput === "true" && document.querySelector("[data-dates-dropdown]"))
  );
}

export function closeOnOwnEscape(close: () => void) {
  return (event: KeyboardEvent) => {
    if (!isOwnEscape(event)) return;
    event.stopPropagation();
    close();
  };
}
