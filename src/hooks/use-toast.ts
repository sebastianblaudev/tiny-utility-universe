
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
    toast: actualToastFunction
  };
};

// Use the actual sonner toast function instead of noop
const actualToastFunction = ((props: ToastProps | string) => {
  if (typeof props === 'string') {
    return sonnerToast(props);
  }
  
  const { description, variant, title, ...rest } = props;
  
  if (variant === "destructive") {
    return sonnerToast.error(title || "", { 
      description: description || undefined,
      ...rest 
    });
  }
  return sonnerToast(title || "", { 
    description: description || undefined,
    ...rest 
  });
}) as ToastFunction;

// Add the helper methods that use sonner directly
actualToastFunction.error = (message: string, options?: Omit<ExternalToast, "description">) => {
  return sonnerToast.error(message, options);
};

actualToastFunction.success = (message: string, options?: Omit<ExternalToast, "description">) => {
  return sonnerToast.success(message, { duration: 2000, ...options });
};

actualToastFunction.info = (message: string, options?: Omit<ExternalToast, "description">) => {
  return sonnerToast.info(message, options);
};

actualToastFunction.warning = (message: string, options?: Omit<ExternalToast, "description">) => {
  return sonnerToast.warning(message, options);
};

// Export the useToast hook
export { useToast };

// Export the toast function directly for use without the hook
export const toast = actualToastFunction as ToastFunction;
