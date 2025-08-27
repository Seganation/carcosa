"use client";
import * as React from "react";

type Toast = { id: number; message: string; variant?: "default" | "success" | "error" };

const ToastContext = React.createContext<(msg: string, variant?: Toast["variant"]) => void>(() => {});

export function useToast() {
  return React.useContext(ToastContext);
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((message: string, variant: Toast["variant"] = "default") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex w-full max-w-sm flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-md border p-3 text-sm shadow ${t.variant === "success" ? "border-green-200 bg-green-50" : t.variant === "error" ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


