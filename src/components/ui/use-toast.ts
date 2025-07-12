
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastProps = {
  description?: string;
  title?: string;
  variant?: "default" | "destructive";
} & Omit<ExternalToast, "description" | "title">; 

export const toast = (props: ToastProps | string) => {
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
};
