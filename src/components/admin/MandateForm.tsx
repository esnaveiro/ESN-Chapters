"use client";

import {useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/Input";
import {Button} from "@/components/ui/Button";
import {createMandate, MandateFormData, updateMandate} from "@/actions/mandates";
import {PhotoUpload} from "./PhotoUpload";
import {PhotoFocusPicker} from "./PhotoFocusPicker";
import {MANDATE_COLORS} from "@/lib/utils";

type Props = {
    mode: "create" | "edit";
    mandateId?: string;
    defaultValues?: Partial<MandateFormData & {photoFocusX: number; photoFocusY: number}>;
    formId?: string;
    hideActions?: boolean;
};

export function MandateForm({mode, mandateId, defaultValues, formId, hideActions}: Props) {
    const router = useRouter();
    const [photoUrl, setPhotoUrl] = useState(defaultValues?.photoUrl ?? "");
    const [focusX, setFocusX] = useState(defaultValues?.photoFocusX ?? 50);
    const [focusY, setFocusY] = useState(defaultValues?.photoFocusY ?? 50);
    const [colorIndex, setColorIndex] = useState(defaultValues?.colorIndex ?? 0);
    const [customColor, setCustomColor] = useState(defaultValues?.customColor ?? "");
    const [useCustom, setUseCustom] = useState(!!defaultValues?.customColor);
    const [hexInput, setHexInput] = useState(defaultValues?.customColor ?? "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const activeColor = useCustom
        ? (customColor || "#888888")
        : MANDATE_COLORS[colorIndex % MANDATE_COLORS.length];

    function selectPreset(i: number) {
        setColorIndex(i);
        setUseCustom(false);
    }

    function activateCustom() {
        const seed = customColor || MANDATE_COLORS[colorIndex % MANDATE_COLORS.length];
        setCustomColor(seed);
        setHexInput(seed);
        setUseCustom(true);
        setTimeout(() => colorInputRef.current?.click(), 50);
    }

    function handleNativeColorChange(hex: string) {
        setCustomColor(hex);
        setHexInput(hex);
    }

    function handleHexInput(raw: string) {
        setHexInput(raw);
        const val = raw.startsWith("#") ? raw : `#${raw}`;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) setCustomColor(val);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const fd = new FormData(e.currentTarget);
        const data: MandateFormData = {
            name: fd.get("name") as string,
            academicYear: fd.get("academicYear") as string,
            startsAt: fd.get("startsAt") as string,
            endsAt: (fd.get("endsAt") as string) || undefined,
            photoUrl,
            photoFocusX: focusX,
            photoFocusY: focusY,
            colorIndex,
            customColor: useCustom ? customColor : "",
        };

        const result =
            mode === "create"
                ? await createMandate(data)
                : await updateMandate(mandateId!, data);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }

        router.push("/admin/mandates");
        router.refresh();
    }

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <PhotoUpload
                bucket="mandate-photos"
                currentUrl={photoUrl}
                onUpload={(url) => { setPhotoUrl(url); setFocusX(50); setFocusY(50); }}
                label="Team photo"
            />

            {photoUrl && (
                <PhotoFocusPicker
                    photoUrl={photoUrl}
                    focusX={focusX}
                    focusY={focusY}
                    onChange={(x, y) => { setFocusX(x); setFocusY(y); }}
                />
            )}

            <Input
                label="Mandate name"
                name="name"
                id="name"
                required
                defaultValue={defaultValues?.name}
                placeholder="e.g. Us 2024/25"
            />

            <Input
                label="Academic year"
                name="academicYear"
                id="academicYear"
                required
                defaultValue={defaultValues?.academicYear}
                placeholder="e.g. 2024/25"
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Start date"
                    name="startsAt"
                    id="startsAt"
                    type="date"
                    required
                    defaultValue={
                        defaultValues?.startsAt
                            ? new Date(defaultValues.startsAt).toISOString().split("T")[0]
                            : ""
                    }
                />
                <Input
                    label="End date"
                    name="endsAt"
                    id="endsAt"
                    type="date"
                    defaultValue={
                        defaultValues?.endsAt
                            ? new Date(defaultValues.endsAt).toISOString().split("T")[0]
                            : ""
                    }
                />
            </div>

            {/* ── Colour picker ──────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5">
                {/* Label + live preview chip */}
                <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-[var(--text-2)]">Colour</label>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[var(--text-4)]">{activeColor}</span>
                        <div
                            className="w-5 h-5 rounded-md border border-black/10 transition-colors duration-150"
                            style={{background: activeColor}}
                        />
                    </div>
                </div>

                {/* Swatch grid */}
                <div
                    className="p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]"
                >
                    <div className="flex flex-wrap gap-2">
                        {/* Preset swatches */}
                        {MANDATE_COLORS.map((color, i) => {
                            const selected = !useCustom && colorIndex === i;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    title={color}
                                    onClick={() => selectPreset(i)}
                                    className="relative w-7 h-7 rounded-md transition-all duration-100 shrink-0 focus-visible:outline-none"
                                    style={{
                                        background: color,
                                        transform: selected ? "scale(1.15)" : "scale(1)",
                                        boxShadow: selected
                                            ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${color}`
                                            : "none",
                                    }}
                                >
                                    {selected && (
                                        <svg
                                            className="absolute inset-0 m-auto"
                                            width="10" height="8" viewBox="0 0 10 8" fill="none"
                                        >
                                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8"
                                                  strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            );
                        })}

                        {/* Custom swatch */}
                        <button
                            type="button"
                            title="Custom colour"
                            onClick={activateCustom}
                            className="relative w-7 h-7 rounded-md shrink-0 flex items-center justify-center transition-all duration-100 focus-visible:outline-none"
                            style={useCustom ? {
                                background: customColor,
                                transform: "scale(1.15)",
                                boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${customColor}`,
                            } : {
                                background: "var(--surface-raised)",
                                border: "1.5px dashed var(--border-strong)",
                            }}
                        >
                            {useCustom ? (
                                <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8"
                                     fill="none">
                                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round"
                                          strokeLinejoin="round"/>
                                </svg>
                            ) : (
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                    <path d="M5.5 2v7M2 5.5h7" stroke="var(--text-3)" strokeWidth="1.6"
                                          strokeLinecap="round"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Custom colour input — shown inline when active */}
                    {useCustom && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2.5">
                            {/* Native color wheel — hidden, triggered by swatch click */}
                            <input
                                ref={colorInputRef}
                                type="color"
                                value={customColor || "#888888"}
                                onChange={(e) => handleNativeColorChange(e.target.value)}
                                className="sr-only"
                            />
                            <button
                                type="button"
                                onClick={() => colorInputRef.current?.click()}
                                className="w-8 h-8 rounded-md shrink-0 border border-black/10 transition-transform hover:scale-105"
                                style={{background: customColor || "#888888"}}
                                title="Open colour picker"
                            />
                            <div className="flex-1 relative">
                                <span
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-mono text-[var(--text-4)] pointer-events-none select-none">#</span>
                                <input
                                    type="text"
                                    value={hexInput.replace(/^#/, "")}
                                    onChange={(e) => handleHexInput(e.target.value)}
                                    maxLength={6}
                                    placeholder="a3b4c5"
                                    className="w-full pl-6 pr-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] text-[12px] font-mono text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setUseCustom(false);
                                    setCustomColor("");
                                    setHexInput("");
                                }}
                                className="text-[11px] text-[var(--text-4)] hover:text-[var(--text-1)] transition-colors shrink-0 px-1"
                                title="Remove custom colour"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!hideActions && (
                <div className="flex gap-3">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving…" : mode === "create" ? "Create mandate" : "Save changes"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            )}
        </form>
    );
}
