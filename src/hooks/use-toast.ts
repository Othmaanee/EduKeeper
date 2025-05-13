
// Importing from the correct location
import { useToast as useToastUIHook } from "@/components/ui/toast";

// Create a re-usable hook that also incorporates a pre-styled "success" toast
export const useToast = () => {
  const { toast, ...rest } = useToastUIHook();
  
  // Enhanced success toast
  const successToast = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      className: "bg-green-500 text-white border-green-600"
    });
  };
  
  return { 
    toast,
    successToast,
    ...rest 
  };
};

// Also export the toast function for direct usage
export { toast } from "@/components/ui/toast";
