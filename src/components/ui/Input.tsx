import {forwardRef, InputHTMLAttributes, TextareaHTMLAttributes} from "react";
import {cn} from "@/lib/utils";

export {Select} from "@/components/ui/Select";

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors duration-150 focus:outline-none focus:border-[var(--color-esn)] focus:ring-2 focus:ring-[var(--color-esn-soft)]";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({label, error, className, id, ...props}, ref) => {
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={id}
                        className="text-sm font-medium text-[var(--color-text-primary)]"
                        style={{}}
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={cn(inputBase, error && "border-red-500", className)}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({label, error, className, id, ...props}, ref) => {
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={id}
                        className="text-sm font-medium text-[var(--color-text-primary)]"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={id}
                    className={cn(
                        inputBase,
                        "resize-y min-h-[100px]",
                        error && "border-red-500",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

