
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastProps = {
  description?: string;
  title?: string;
  variant?: "default" | "destructive";
} & Omit<ExternalToast, "description" | "title">;

// Define the type for our toast function that includes the helper methods
export interface ToastFunction {
  (props: ToastProps | string): string | number;
  error: (message: string, options?: Omit<ExternalToast, "description">) => string | number;
  success: (message: string, options?: Omit<ExternalToast, "description">) => string | number;
  info: (message: string, options?: Omit<ExternalToast, "description">) => string | number;
  warning: (message: string, options?: Omit<ExternalToast, "description">) => string | number;
}

const useToast = () => {
  return {
    toast: noopToastFunction
  };
};

// Define a no-operation toast function that keeps the same interface
// but doesn't actually display any toasts
const noopToastFunction = ((props: ToastProps | string) => {
  // Just return a dummy ID without showing any toast
  return Math.random().toString();
}) as ToastFunction;

// Add the helper methods to the function, but they do nothing
noopToastFunction.error = (message: string, options?: Omit<ExternalToast, "description">) => {
  console.log("Toast error (hidden):", message);
  return Math.random().toString();
};

noopToastFunction.success = (message: string, options?: Omit<ExternalToast, "description">) => {
  // For success toasts, we still want to ensure 2-second duration
  // But we handle this via the Toaster configuration instead of here
  console.log("Toast success (hidden):", message);
  return Math.random().toString();
};

noopToastFunction.info = (message: string, options?: Omit<ExternalToast, "description">) => {
  console.log("Toast info (hidden):", message);
  return Math.random().toString();
};

noopToastFunction.warning = (message: string, options?: Omit<ExternalToast, "description">) => {
  console.log("Toast warning (hidden):", message);
  return Math.random().toString();
};

// Export the useToast hook
export { useToast };

// Export the toast function directly for use without the hook
export const toast = noopToastFunction as ToastFunction;
