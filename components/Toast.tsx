"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

const STYLES: Record<
  ToastItem["type"],
  { icon: typeof CheckCircle2; classes: string }
> = {
  success: {
    icon: CheckCircle2,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    icon: XCircle,
    classes: "border-red-200 bg-red-50 text-red-800",
  },
  info: {
    icon: Info,
    classes: "border-blue-200 bg-blue-50 text-blue-800",
  },
};

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => {
        const { icon: Icon, classes } = STYLES[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "animate-toast-in flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-elevated",
              classes
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
