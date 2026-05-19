import Link from "next/link";
import {MandateForm} from "@/components/admin/MandateForm";

export default function NewMandatePage() {
    return (
        <div>
            <Link
                href="/admin/mandates"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Mandates
            </Link>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8 mt-2">
                Create mandate
            </h1>
            <MandateForm mode="create"/>
        </div>
    );
}
