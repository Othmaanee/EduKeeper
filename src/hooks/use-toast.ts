
import { toast as sonnerToast, type Toast } from "sonner"

import {
  ToastAction,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

export type ToastVariant = NonNullable<ToastProps["variant"]>

export type ToasterToast = Omit<ToastProps, keyof Toast>

export interface ToastOptions extends ToasterToast {
  description?: React.ReactNode
}

const DEFAULT_TOAST_DURATION = 5000 // 5 seconds

export function toast({
  variant = "default",
  title,
  description,
  action,
  ...props
}: ToastOptions) {
  return sonnerToast(title, {
    ...props,
    description: description,
    duration: props.duration || DEFAULT_TOAST_DURATION,
    className: variant ? `variant-${variant}` : undefined,
    action,
  })
}

export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (message: string) =>
      toast({ title: "Error", description: message, variant: "destructive" }),
    success: (message: string) =>
      toast({ title: "Success", description: message }),
  }
}
