"use client";

import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import {cn} from "@/lib/utils";

interface CheckboxProps {
    checked: boolean | "indeterminate";
    onCheckedChange: (checked: boolean) => void;
    className?: string;
    disabled?: boolean;
}

export function Checkbox({checked, onCheckedChange, className, disabled}: CheckboxProps) {
    return (
        <RadixCheckbox.Root
            checked={checked}
            onCheckedChange={(v) => onCheckedChange(v === true)}
            disabled={disabled}
            className={cn(
                "w-[15px] h-[15px] shrink-0 rounded-[3px] border border-[var(--border)]",
                "bg-[var(--surface)] transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-light)] focus-visible:border-[var(--accent)]",
                "data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]",
                "data-[state=indeterminate]:bg-[var(--accent)] data-[state=indeterminate]:border-[var(--accent)]",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "cursor-pointer",
                className
            )}
        >
            <RadixCheckbox.Indicator className="flex items-center justify-center text-white">
                {checked === "indeterminate" ? (
                    <svg width="9" height="2" viewBox="0 0 9 2" fill="none">
                        <path d="M1 1h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                ) : (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5l2.5 2.5L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
            </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>
    );
}
