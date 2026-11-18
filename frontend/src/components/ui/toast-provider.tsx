"use client";

import * as React from "react";
import { Toast, ToastItem, ToastType } from "./toast";

type ToastHelper = (first: string, second?: string) => void;

type ToastFn = ((options: { type: ToastType; message: string; title?: string; duration?: number }) => void) & {
  success: ToastHelper;
  error: ToastHelper;
  warning: ToastHelper;
  info: ToastHelper;
};

interface ToastContextType {
  toast: ToastFn;
  success: ToastHelper;
  error: ToastHelper;
  warning: ToastHelper;
  info: ToastHelper;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    ({ type, message, title, duration }: { type: ToastType; message: string; title?: string; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    },
    []
  );

  const makeHelper = React.useCallback(
    (type: ToastType, defaultTitle: string) => (first: string, second?: string) => {
      if (second) {
        // First is title, second is detailed message
        addToast({ type, title: first, message: second });
      } else {
        // Single argument: it's the message, use default title
        addToast({ type, title: defaultTitle, message: first });
      }
    },
    [addToast]
  );

  const success = React.useMemo(() => makeHelper("success", "Success"), [makeHelper]);
  const error = React.useMemo(() => makeHelper("error", "Error"), [makeHelper]);
  const warning = React.useMemo(() => makeHelper("warning", "Attention"), [makeHelper]);
  const info = React.useMemo(() => makeHelper("info", "Information"), [makeHelper]);

  const toastCallable = React.useMemo(() => {
    const fn = (opts: { type: ToastType; message: string; title?: string; duration?: number }) => addToast(opts);
    fn.success = success;
    fn.error = error;
    fn.warning = warning;
    fn.info = info;
    return fn as ToastFn;
  }, [addToast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={{ toast: toastCallable, success, error, warning, info }}>
      {children}
      {/* Fixed Toast Container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
