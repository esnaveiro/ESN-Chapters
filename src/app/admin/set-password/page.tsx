"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {Input} from "@/components/ui/Input";
import {Button} from "@/components/ui/Button";
import {APP_TITLE} from "@/lib/config";

export default function SetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        const supabase = createClient();
        const {error} = await supabase.auth.updateUser({password});
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push("/admin");
        router.refresh();
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
            <div
                className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] p-8 bg-[var(--surface)]">
                <div className="mb-8 text-center">
                    <p className="text-[15px] font-bold text-[var(--text-1)] tracking-[-0.01em] mb-1">
                        {APP_TITLE}
                    </p>
                    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text-4)]">
                        Set your password
                    </p>
                </div>

                <p className="text-[13px] text-[var(--text-3)] mb-6 text-center">
                    Choose a password to complete your account setup.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="New password"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                    />
                    <Input
                        label="Confirm password"
                        type="password"
                        id="confirm"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    {error && <p className="text-[13px] text-red-600">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Setting password…" : "Set password & sign in"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
