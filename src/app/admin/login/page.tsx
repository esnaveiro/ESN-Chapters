"use client";

import {useEffect, useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useRouter, useSearchParams} from "next/navigation";
import Image from "next/image";
import {Button} from "@/components/ui/Button";
import {SECTION_NAME} from "@/lib/config";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    const linkError = searchParams.get("error") === "invalid_link"
        ? "This invite link is invalid or has expired. Ask an admin to send a new invitation."
        : "";

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({data: {user}}) => {
            if (user) router.replace("/admin");
            else setChecking(false);
        });
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const supabase = createClient();
        const {error} = await supabase.auth.signInWithPassword({email, password});
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }
        router.push("/admin");
        router.refresh();
    }

    if (checking) return null;

    const inputClass =
        "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
            <div className="w-full max-w-[360px]">

                {/* Logo / wordmark */}
                <div className="mb-10 text-center">
                    <div className="inline-flex mb-4">
                        <Image src="/icons/icon-256.png" alt={SECTION_NAME} width={80} height={80}
                               className="rounded-[var(--radius-lg)]"/>
                    </div>
                    <h1 className="text-[20px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-1">
                        {SECTION_NAME}
                    </h1>
                    <p className="text-[12px] text-[var(--text-4)] font-medium tracking-[0.1em] uppercase">
                        Admin
                    </p>
                </div>

                {/* Card */}
                <div
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm">
                    {linkError && (
                        <div className="mb-5 rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-4 py-3">
                            <p className="text-[12px] text-red-700 leading-snug">{linkError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="email"
                                   className="text-[12px] font-medium text-[var(--text-2)]">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                autoFocus
                                placeholder="you@example.com"
                                className={inputClass}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="password"
                                   className="text-[12px] font-medium text-[var(--text-2)]">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className={inputClass}
                            />
                        </div>

                        {error && (
                            <p className="text-[12px] text-red-600 leading-snug">{error}</p>
                        )}

                        <Button type="submit" className="w-full mt-1" disabled={loading}>
                            {loading ? "Signing in…" : "Sign in"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
