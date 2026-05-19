import Link from "next/link";
import {BadgeForm} from "@/components/admin/BadgeForm";

export default function NewBadgePage() {
    return (
        <div className="max-w-[600px]">
            <Link
                href="/admin/badges"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Badges
            </Link>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8 mt-2">
                New badge
            </h1>
            <BadgeForm mode="create"/>
        </div>
    );
}
