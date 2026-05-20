export const dynamic = "force-dynamic";

import {prisma} from "@/lib/prisma";
import {MandateLedger} from "@/components/public/MandateLedger";

export default async function MandatesPage() {
    const mandates = await prisma.mandate.findMany({
        orderBy: {startsAt: "desc"},
        include: {_count: {select: {memberships: true, events: true}}},
    });

    return (
        <div className="h-[calc(100dvh-112px)] overflow-hidden -mb-16 md:mb-0 lg:h-[calc(100dvh-56px)] lg:px-16">
            <MandateLedger mandates={mandates}/>
        </div>
    );
}
