import {ButtonHTMLAttributes, forwardRef} from "react";
import {cn} from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({variant = "primary", size = "md", className, children, ...props}, ref) => {
        const base =
            "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]",
            secondary: "bg-white text-[var(--text-1)] border border-[var(--border)] hover:bg-[var(--surface-raised)]",
            ghost: "bg-transparent text-[var(--text-2)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-1)]",
            danger: "bg-red-500 text-white hover:bg-red-600",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs gap-1.5",
            md: "px-4 py-2 text-sm gap-2",
            lg: "px-5 py-2.5 text-sm gap-2",
        };

        return (
            <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
