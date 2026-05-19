"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {BADGE_ICONS, BadgeIcon} from "@/components/ui/BadgeIcon";
import {createBadge, updateBadge} from "@/actions/badges";

const ICON_OPTIONS = Object.keys(BADGE_ICONS) as (keyof typeof BADGE_ICONS)[];

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

function IconPicker({value, onChange}: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[var(--text-2)]">Icon</label>
            <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((name) => {
                    const selected = value === name;
                    return (
                        <button
                            key={name}
                            type="button"
                            title={name}
                            onClick={() => onChange(selected ? "" : name)}
                            className={[
                                "w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center transition-colors duration-100",
                                selected
                                    ? "bg-[var(--text-1)] text-white"
                                    : "bg-[var(--surface-raised)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--border)]",
                            ].join(" ")}
                        >
                            <BadgeIcon name={name} size={14}/>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

type Props = {
    mode: "create" | "edit";
    badgeId?: string;
    defaultValues?: { name?: string; description?: string; icon?: string };
};

export function BadgeForm({mode, badgeId, defaultValues}: Props) {
    const router = useRouter();
    const [name, setName] = useState(defaultValues?.name ?? "");
    const [desc, setDesc] = useState(defaultValues?.description ?? "");
    const [icon, setIcon] = useState(defaultValues?.icon ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name) {
            setError("Name is required");
            return;
        }
        setLoading(true);
        setError("");

        const result = mode === "create"
            ? await createBadge(name, desc, icon)
            : await updateBadge(badgeId!, name, desc, icon);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }
        router.push("/admin/badges");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <IconPicker value={icon} onChange={setIcon}/>

            <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Top Organiser"
                    className={inputBase}
                    required
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Description</label>
                <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="What this badge recognises…"
                    className={inputBase}
                />
            </div>

            {error && <p className="text-[12px] text-red-600">{error}</p>}

            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "Saving…" : mode === "create" ? "Create badge" : "Save changes"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
