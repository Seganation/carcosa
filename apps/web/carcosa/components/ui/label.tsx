import * as React from "react";

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`mb-1 block text-xs font-medium text-zinc-600 ${className}`} {...props} />;
}


