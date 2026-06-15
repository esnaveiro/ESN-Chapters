"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

type AdminUser = {
    id: string;
    email: string;
    createdAt: string;
    lastSignIn: string | null;
    isCurrentUser: boolean;
};

type Props = {
    users: AdminUser[];
};

export function AdminUserList({users}: Props) {
    const router = useRouter();
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleRevoke(userId: string) {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/revoke", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({userId}),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message ?? "Failed to revoke access");
                return;
            }
            setConfirmingId(null);
            router.refresh();
        } catch {
            setError("Network error — please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col">
            {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0">
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[var(--text-1)] font-medium truncate">
                            {u.email}
                            {u.isCurrentUser && (
                                <span className="ml-2 text-[11px] font-normal text-[var(--text-4)]">(you)</span>
                            )}
                        </p>
                        <p className="text-[11px] text-[var(--text-4)] mt-0.5">
                            Joined {new Date(u.createdAt).toLocaleDateString("en-GB")}
                            {u.lastSignIn && (
                                <> · Last sign-in {new Date(u.lastSignIn).toLocaleDateString("en-GB")}</>
                            )}
                        </p>
                    </div>
                    {!u.isCurrentUser && (
                        confirmingId === u.id ? (
                            <span className="flex items-center gap-2 shrink-0">
                <button
                    onClick={() => handleRevoke(u.id)}
                    disabled={loading}
                    className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-40"
                >
                  {loading ? "Revoking…" : "Confirm revoke"}
                </button>
                <span className="text-[var(--text-4)] text-[12px]">·</span>
                <button
                    onClick={() => setConfirmingId(null)}
                    className="text-[12px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                >
                  Cancel
                </button>
              </span>
                        ) : (
                            <button
                                onClick={() => setConfirmingId(u.id)}
                                className="text-[12px] text-[var(--text-4)] hover:text-red-500 transition-colors shrink-0"
                            >
                                Revoke access
                            </button>
                        )
                    )}
                </div>
            ))}
            {error && <p className="text-[12px] text-red-600 mt-3">{error}</p>}
        </div>
    );
}
