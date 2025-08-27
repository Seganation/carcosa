import * as React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = "", ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-md border border-zinc-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 ${className}`}
      {...props}
    />
  );
});


