
import { toast as sonnerToast } from "sonner";

import {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

export type ToastVariant = NonNullable<ToastProps["variant"]>;

export interface ToastOptions {
  variant?: ToastVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
  className?: string;
}

const DEFAULT_TOAST_DURATION = 5000; // 5 seconds

export function toast({
  variant = "default",
  title,
  description,
  action,
  duration = DEFAULT_TOAST_DURATION,
  className,
  ...props
}: ToastOptions) {
  return sonnerToast(title as string, {
    description,
    duration,
    className: variant ? `variant-${variant}` : className,
    action,
    ...props
  });
}

export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (message: string) =>
      toast({ title: "Error", description: message, variant: "destructive" }),
    success: (message: string) =>
      toast({ title: "Success", description: message }),
  };
};
