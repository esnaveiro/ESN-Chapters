import {MemberStatus} from "@/generated/prisma/enums";
import {STATUS_COLORS, STATUS_LABELS} from "@/lib/utils";

export function StatusBadge({status, className = ""}: { status: MemberStatus; className?: string }) {
    const {bg, text} = STATUS_COLORS[status];
    return (
        <span
            className={`inline-flex items-center px-1.5 py-px rounded text-xs font-medium ${className}`}
            style={{background: bg, color: text}}
        >
      {STATUS_LABELS[status]}
    </span>
    );
}

export function Badge({
                          children,
                          variant = "default",
                          className = "",
                      }: {
    children: React.ReactNode;
    variant?: "default" | "accent" | "outline";
    className?: string;
}) {
    const v = {
        default: {background: "var(--surface-raised)", color: "var(--text-2)", border: "var(--border)"},
        accent: {background: "var(--accent-light)", color: "var(--accent)", border: "var(--accent-light)"},
        outline: {background: "transparent", color: "var(--text-3)", border: "var(--border-strong)"},
    }[variant];

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
            style={v}
        >
      {children}
    </span>
    );
}
