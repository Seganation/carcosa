import { useRouter } from "next/navigation";
import { Button } from "./button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  onClick?: () => void;
}

export function BackButton({
  fallbackHref,
  label = "Back",
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Try browser back first
    if (window.history.length > 1) {
      router.back();
    } else if (fallbackHref) {
      // Fallback to provided href if no history
      router.push(fallbackHref);
    } else {
      // Default fallback to dashboard
      router.push("/dashboard");
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
