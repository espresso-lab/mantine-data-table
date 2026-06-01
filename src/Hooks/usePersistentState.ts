import { useState } from "react";

export function usePersistentState<T>(
  initialValue: T,
  key: string,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = `use_persistent_storage_${key}`;

  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? (JSON.parse(storedValue) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setPersistentState = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = value instanceof Function ? value(prev) : value;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return [state, setPersistentState];
}
