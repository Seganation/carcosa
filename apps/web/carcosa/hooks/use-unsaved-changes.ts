import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to warn users about unsaved changes before navigating away
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param message - Custom warning message (optional)
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  message: string = "You have unsaved changes. Are you sure you want to leave?"
) {
  useEffect(() => {
    // Warn on browser close/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  // Return a function to check before navigation
  const checkUnsavedChanges = useCallback(() => {
    if (hasUnsavedChanges) {
      return window.confirm(message);
    }
    return true;
  }, [hasUnsavedChanges, message]);

  return { checkUnsavedChanges };
}
