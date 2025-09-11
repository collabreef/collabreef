import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { ToastMessage, useToastStore } from "../../stores/toast";

export function Toast({ toast }: { toast: ToastMessage }) {
  const removeToast = useToastStore((s) => s.removeToast);

  const icon =
    toast.type === "success" ? <CheckCircle2 className="text-green-500" /> :
    toast.type === "error" ? <XCircle className="text-red-500" /> :
    <Info className="text-blue-500" />;

  return (
    <RadixToast.Root
      open={true}
      onOpenChange={(open) => !open && removeToast(toast.id)}
      className="bg-white dark:bg-neutral-900 shadow-lg rounded-xl p-4 flex items-start gap-3 border border-gray-200 data-[state=open]:animate-slideIn data-[state=closed]:animate-slideOut"
    >
      {icon}
      <div>
        <RadixToast.Title className="font-semibold">
          {toast.title}
        </RadixToast.Title>
        {toast.description && (
          <RadixToast.Description className="text-sm text-gray-600">
            {toast.description}
          </RadixToast.Description>
        )}
      </div>
    </RadixToast.Root>
  );
}