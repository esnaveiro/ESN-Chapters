"use client";

import {useEffect, useRef, useState} from "react";
import {cn} from "@/lib/utils";

interface Option {
    value: string;
    label: string;
}

interface ComboboxProps {
    value: string;
    onValueChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export function Combobox({value, onValueChange, options, placeholder = "— search or select —", className}: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedLabel = options.find(o => o.value === value)?.label ?? "";
    const filtered = query
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleSelect(opt: Option) {
        onValueChange(opt.value);
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <div className="relative">
                <input
                    ref={inputRef}
                    value={open ? query : selectedLabel}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 pr-8 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                />
                <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className="absolute right-3 top-1/2 -translate-y-1/2 shrink-0 text-[var(--text-3)] pointer-events-none"
                >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-[13px] text-[var(--text-4)]">No results</p>
                    ) : (
                        <div className="max-h-[260px] overflow-y-auto p-1">
                            {filtered.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); handleSelect(opt); }}
                                    className={cn(
                                        "w-full text-left rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5",
                                        "text-[13px] text-[var(--text-1)] transition-colors",
                                        "hover:bg-[var(--surface-raised)]",
                                        opt.value === value && "font-medium",
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
