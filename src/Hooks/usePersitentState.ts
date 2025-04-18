import { useEffect, useState } from "react";

export function usePersistentState<T>(
  initialValue: T,
  key: string,
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    const storedValue = localStorage.getItem(`use_persistent_storage_${key}`);
    return storedValue ? (JSON.parse(storedValue) as T) : initialValue;
  });

  const setStateWrapper = (newState: T) => {
    setState(newState);
    localStorage.setItem(
      `use_persistent_storage_${key}`,
      JSON.stringify(newState),
    );
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `use_persistent_storage_${key}` && event.newValue) {
        setState(JSON.parse(event.newValue) as T);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [state, setStateWrapper];
}
