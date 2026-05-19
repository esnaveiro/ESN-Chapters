"use client";

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import {cn} from "@/lib/utils";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    error?: string;
    className?: string;
    disabled?: boolean;
}

export function Select({
                           value,
                           onValueChange,
                           options,
                           placeholder = "— select —",
                           label,
                           error,
                           className,
                           disabled,
                       }: SelectProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <span className="text-[12px] font-medium text-[var(--text-2)]">{label}</span>
            )}
            <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
                <RadixSelect.Trigger
                    className={cn(
                        "flex w-full items-center justify-between gap-2",
                        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]",
                        "px-3 py-2 text-[13px] text-[var(--text-1)]",
                        "transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]",
                        "data-[placeholder]:text-[var(--text-4)]",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        error && "border-red-500",
                        className
                    )}
                >
                    <RadixSelect.Value placeholder={placeholder}/>
                    <RadixSelect.Icon asChild>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            className="shrink-0 text-[var(--text-3)]"
                        >
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                  strokeLinejoin="round"/>
                        </svg>
                    </RadixSelect.Icon>
                </RadixSelect.Trigger>

                <RadixSelect.Portal>
                    <RadixSelect.Content
                        position="popper"
                        sideOffset={4}
                        className={cn(
                            "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
                            "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]",
                            "shadow-lg",
                            "data-[state=open]:animate-in data-[state=closed]:animate-out",
                            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                            "data-[side=bottom]:slide-in-from-top-2"
                        )}
                    >
                        <RadixSelect.Viewport className="p-1">
                            {options.map((opt) => (
                                <RadixSelect.Item
                                    key={opt.value}
                                    value={opt.value}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center",
                                        "rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 pr-8",
                                        "text-[13px] text-[var(--text-1)]",
                                        "outline-none",
                                        "data-[highlighted]:bg-[var(--surface-raised)] data-[highlighted]:text-[var(--text-1)]",
                                        "data-[state=checked]:font-medium"
                                    )}
                                >
                                    <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                                    <RadixSelect.ItemIndicator className="absolute right-2">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5"
                                                  strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </RadixSelect.ItemIndicator>
                                </RadixSelect.Item>
                            ))}
                        </RadixSelect.Viewport>
                    </RadixSelect.Content>
                </RadixSelect.Portal>
            </RadixSelect.Root>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
