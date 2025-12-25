import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Map, Calendar, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ViewType } from "@/types/view";

interface ViewTypeSelectProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
}

export default function ViewTypeSelect({ value, onChange }: ViewTypeSelectProps) {
  const { t } = useTranslation();

  const items = [
    { value: "map" as ViewType, label: t("views.map"), icon: Map },
    { value: "calendar" as ViewType, label: t("views.calendar"), icon: Calendar },
    { value: "kanban" as ViewType, label: t("views.kanban") || "Kanban", icon: LayoutGrid },
  ];

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="px-2 py-1 rounded-lg dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 cursor-pointer">
        <Select.Value />
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={6}
          className="overflow-hidden w-60 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-xl z-[9999] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Select.Viewport className="p-1">
            {items.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
                className="relative flex items-center p-3 rounded-lg text-sm outline-none cursor-pointer select-none data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-neutral-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Select.ItemText>
                  <div className="flex items-center gap-6 w-full">
                    <item.icon size={16} />
                    {item.label}
                  </div>
                </Select.ItemText>
                <Select.ItemIndicator className="absolute right-2">
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
