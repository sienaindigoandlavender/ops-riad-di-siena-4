"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastVariant = "error" | "success" | "info";

interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const api: ToastApi = {
    error: (m) => push(m, "error"),
    success: (m) => push(m, "success"),
    info: (m) => push(m, "info"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100%-3rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto bg-cream border px-4 py-3 fade-rise shadow-sm ${
              t.variant === "error"
                ? "border-brick/25 text-brick"
                : t.variant === "success"
                ? "border-sage/30 text-forest"
                : "border-border-subtle text-ink-secondary"
            }`}
            role="status"
          >
            <p className="text-[13px] font-light leading-relaxed normal-case tracking-normal">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
