"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";

type Props = {
    label?: string;
    confirmText: string;
    redirectTo: string;
    action: () => Promise<{ success: boolean; error?: string }>;
};

export function DeleteButton({label = "Delete", confirmText, redirectTo, action}: Props) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setLoading(true);
        setError("");
        const result = await action();
        if (!result.success) {
            setError(result.error ?? "Something went wrong");
            setLoading(false);
            setConfirming(false);
            return;
        }
        router.push(redirectTo);
        router.refresh();
    }

    if (confirming) {
        return (
            <div className="flex flex-col gap-2 items-end">
                <p className="text-[12px] text-[var(--text-3)] text-right max-w-[240px]">{confirmText}</p>
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleDelete} disabled={loading}>
                        {loading ? "Deleting…" : "Yes, delete"}
                    </Button>
                </div>
                {error && <p className="text-[12px] text-red-600">{error}</p>}
            </div>
        );
    }

    return (
        <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
            {label}
        </Button>
    );
}
