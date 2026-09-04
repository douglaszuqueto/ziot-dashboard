import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  search?: string;
};

// SearchableSelect é o seletor padrão para opções vindas do banco (tenants,
// clientes, perfis, CLPs...). Lista longa sem busca é inutilizável, então todo
// select populado por query usa este componente; <Select> fica só para listas
// fixas e curtas (tipo de dado, status).
export const SearchableSelect = ({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled,
  onChange,
}: {
  value: string;
  options: readonly ComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          // bg-white explícito, como o Input e o SelectTrigger do admin: aqui o
          // --background é off-white e o campo sumiria dentro do diálogo.
          className="h-11 w-full justify-between rounded-xl bg-white px-3 text-left font-normal"
          disabled={disabled}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className="min-w-0 truncate">
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[60] w-[--radix-popover-trigger-width] bg-white p-0"
        onWheel={(event) => event.stopPropagation()}
      >
        <Command className="bg-white">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-64 overscroll-contain">
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  value={`${option.label} ${option.description ?? ""} ${option.search ?? ""}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{option.label}</p>
                    {option.description ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
