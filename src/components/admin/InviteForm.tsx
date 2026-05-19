"use client";

import {useState} from "react";
import {Input} from "@/components/ui/Input";
import {Button} from "@/components/ui/Button";

export function InviteForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const res = await fetch("/api/admin/invite", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email}),
        });

        const data = await res.json();
        let message = data.message ?? (res.ok ? "Invitation sent!" : "Failed to send invitation");
        if (!res.ok && typeof message === "string" && message.toLowerCase().includes("rate limit")) {
            message = "Email rate limit reached (Supabase free tier allows 2 emails/hour). Wait an hour or configure a custom SMTP provider in the Supabase dashboard.";
        }
        setResult({success: res.ok, message});
        setLoading(false);
        if (res.ok) setEmail("");
    }

    return (
        <div className="flex flex-col gap-3">
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <div className="flex-1">
                    <Input
                        label="Email address"
                        type="email"
                        id="inviteEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="hr@esnaveiro.pt"
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? "Sending…" : "Send invite"}
                </Button>
            </form>
            {result && (
                <p className={`text-[12px] leading-snug ${result.success ? "text-[var(--accent)]" : "text-red-600"}`}>
                    {result.message}
                </p>
            )}
        </div>
    );
}
