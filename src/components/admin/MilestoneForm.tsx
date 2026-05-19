"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MilestoneType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { createMilestone, updateMilestone, MilestoneFormData } from "@/actions/milestones";

const TYPE_META: Record<MilestoneType, { label: string; color: string }> = {
  EVENT: { label: "Event", color: "#0ea5e9" },
  FIRST: { label: "First", color: "#7ac143" },
  AWARD: { label: "Award", color: "#facc15" },
  OTHER: { label: "Other", color: "#b5b5b5" },
};

const inputBase =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

type Props = {
  mode: "create" | "edit";
  milestoneId?: string;
  defaultValues?: Partial<MilestoneFormData>;
  mandates: { id: string; name: string }[];
};

export function MilestoneForm({ mode, milestoneId, defaultValues, mandates }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [desc, setDesc] = useState(defaultValues?.description ?? "");
  const [date, setDate] = useState(defaultValues?.happenedAt ?? "");
  const [type, setType] = useState<MilestoneType>(defaultValues?.type ?? "EVENT");
  const [mandateId, setMandateId] = useState(defaultValues?.mandateId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) { setError("Title and date are required"); return; }
    setLoading(true); setError("");

    const data: MilestoneFormData = {
      title, description: desc, happenedAt: date,
      type, mandateId: mandateId || undefined,
    };

    const result = mode === "create"
      ? await createMilestone(data)
      : await updateMilestone(milestoneId!, data);

    if (!result.success) { setError(result.error); setLoading(false); return; }
    router.push("/admin/milestones");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-[var(--text-2)]">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. First international event"
          className={inputBase}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-[var(--text-2)]">Description</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Optional context or note…"
          className={`${inputBase} min-h-[72px] resize-y`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-[var(--text-2)]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputBase}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-[var(--text-2)]">Type</label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as MilestoneType)}
            options={Object.entries(TYPE_META).map(([val, { label }]) => ({ value: val, label }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-[var(--text-2)]">Mandate</label>
        <Select
          value={mandateId}
          onValueChange={setMandateId}
          placeholder="— none —"
          options={mandates.map((m) => ({ value: m.id, label: m.name }))}
        />
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving…" : mode === "create" ? "Create milestone" : "Save changes"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
