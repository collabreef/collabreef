import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Eye, Building2, Lock } from "lucide-react";

// visibility: "public" | "workspace" | "private"
export default function VisibilitySelect({ value, onChange }: any) {
  const items = [
    { value: "public", label: "Public", icon: Eye },
    { value: "workspace", label: "Workspace", icon: Building2 },
    { value: "private", label: "Private", icon: Lock },
  ];

  const current = items.find((i) => i.value === value) ?? items[0];

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm cursor-pointer w-48">
        <div className="flex items-center gap-2">
          {current.icon && <current.icon size={16} />}
          <Select.Value />
        </div>
        <ChevronDown size={16} />
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <Select.Viewport className="p-1">
            {items.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <Select.ItemText>
                  <div className="flex items-center gap-2">
                    <item.icon size={16} />
                    {item.label}
                  </div>
                </Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check size={16} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}