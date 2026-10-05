import { SegmentedControl, Select } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

export interface ViewSwitchOption<T extends string> {
  value: T;
  label: string;
}

export interface ViewSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  data: ViewSwitchOption<T>[];
  label: string;
}

export function ViewSwitch<T extends string>({ value, onChange, data, label }: ViewSwitchProps<T>) {
  const mobile = useMediaQuery("(max-width: 48em)", false, { getInitialValueInEffect: false });

  return mobile ? (
    <Select
      aria-label={label}
      data={data}
      value={value}
      onChange={(next) => next && onChange(next as T)}
      allowDeselect={false}
      w="100%"
    />
  ) : (
    <SegmentedControl
      aria-label={label}
      data={data}
      value={value}
      onChange={(next) => onChange(next as T)}
      w="fit-content"
      maw="100%"
    />
  );
}
