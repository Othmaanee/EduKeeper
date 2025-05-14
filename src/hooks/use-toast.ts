
// Create a proper use-toast implementation
import { Toast, ToastActionElement, type ToastProps } from "@/components/ui/toast";
import { create } from "zustand";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToasterState = {
  toasts: ToasterToast[];
};

type ToasterStore = ToasterState & {
  add: (toast: Omit<ToasterToast, "id">) => void;
  dismiss: (toastId: string) => void;
  remove: (toastId: string) => void;
};

// Create the store for managing toasts
const useToastStore = create<ToasterStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  dismiss: (toastId) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === toastId ? { ...toast, open: false } : toast
      ),
    }));
  },
  remove: (toastId) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    }));
  },
}));

// Export the hooks and toast functions
export const useToast = () => {
  const { add, dismiss, remove, toasts } = useToastStore();

  // Enhanced success toast
  const successToast = (title: string, description?: string) => {
    add({
      title,
      description,
      variant: "default",
      className: "bg-green-500 text-white border-green-600"
    });
  };

  return {
    toast: (props: Omit<ToasterToast, "id">) => add(props),
    dismiss,
    remove,
    toasts,
    successToast
  };
};

// Also export toast function for direct usage
export const toast = (props: Omit<ToasterToast, "id">) => {
  const { add } = useToastStore();
  return add(props);
};
