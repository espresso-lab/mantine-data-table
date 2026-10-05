import { Input, TextInput, TextInputProps } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

export interface SearchInputProps
  extends Omit<TextInputProps, "value" | "onChange" | "leftSection" | "rightSection" | "rightSectionPointerEvents"> {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange, placeholder = "Suchen", ...props }: SearchInputProps) {
  return (
    <TextInput
      enterKeyHint="search"
      w={{ base: "100%", sm: 280 }}
      aria-label={placeholder}
      {...props}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      leftSection={<IconSearch size={16} />}
      rightSection={value ? <Input.ClearButton aria-label="Suche leeren" onClick={() => onChange("")} /> : null}
      rightSectionPointerEvents="auto"
    />
  );
}
