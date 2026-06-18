import Link from "next/link";
import {MemberImportClient} from "@/components/admin/MemberImportClient";

export default function ImportMembersPage() {
    return (
        <div>
            <Link
                href="/admin/members"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Members
            </Link>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-2 mt-2">
                Import from Excel
            </h1>
            <p className="text-[13px] text-[var(--text-3)] mb-8 max-w-xl">
                Upload the Google Forms responses spreadsheet. You&rsquo;ll get a preview of every
                row — new members, and field-by-field differences for people already on the site —
                and choose exactly what to apply before anything is saved.
            </p>
            <MemberImportClient/>
        </div>
    );
}
