import * as React from "react";
import clsx from "clsx";

type Variant = "default" | "secondary" | "ghost" | "destructive";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-zinc-900 text-white hover:bg-zinc-800",
  secondary: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-100",
  ghost: "bg-transparent hover:bg-zinc-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className = "", variant = "default", ...props }, ref) {
  return (
    <button ref={ref} className={clsx("inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition", variantClasses[variant], className)} {...props} />
  );
});


