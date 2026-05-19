"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {MemberStatus} from "@/generated/prisma/enums";
import {Button} from "@/components/ui/Button";
import {STATUS_LABELS} from "@/lib/utils";
import {promoteMember} from "@/actions/members";

const STATUS_ORDER: MemberStatus[] = [
    "NEWBIE",
    "CANDIDATE_MEMBER",
    "JUNIOR",
    "SENIOR",
    "ALUMNI",
];

type Props = {
    memberId: string;
    currentStatus: MemberStatus;
};

export function PromoteButton({memberId, currentStatus}: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirming, setConfirming] = useState(false);

    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const nextStatus = STATUS_ORDER[currentIndex + 1];

    if (!nextStatus) return null;

    async function handlePromote() {
        if (!confirming) {
            setConfirming(true);
            return;
        }

        setLoading(true);
        setError("");

        const result = await promoteMember(memberId, nextStatus);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            setConfirming(false);
            return;
        }

        router.refresh();
        setLoading(false);
        setConfirming(false);
    }

    return (
        <div className="flex items-center gap-3">
            <Button
                onClick={handlePromote}
                disabled={loading}
                variant={confirming ? "primary" : "secondary"}
            >
                {loading
                    ? "Promoting…"
                    : confirming
                        ? `Confirm → ${STATUS_LABELS[nextStatus]}`
                        : `Promote to ${STATUS_LABELS[nextStatus]}`}
            </Button>
            {confirming && (
                <Button
                    variant="ghost"
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                >
                    Cancel
                </Button>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
