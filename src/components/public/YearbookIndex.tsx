"use client";

import {useEffect, useState} from "react";
import {sectionId} from "@/lib/yearbook";

type IndexEntry = { year: string; color: string; edition: string };

export function YearbookIndex({entries}: { entries: IndexEntry[] }) {
    const [activeYear, setActiveYear] = useState<string>(entries[0]?.year ?? "");

    useEffect(() => {
        if (!entries.length) return;

        const observers: IntersectionObserver[] = [];

        entries.forEach(({year}) => {
            const el = document.getElementById(sectionId(year));
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) setActiveYear(year);
                },
                {rootMargin: "-56px 0px -60% 0px", threshold: 0},
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach(o => o.disconnect());
    }, [entries]);

    return (
        <aside className="w-[72px] shrink-0 sticky top-[108px] h-fit flex flex-col gap-0.5">
            {entries.map(({year, color, edition}) => {
                const active = activeYear === year;
                return (
                    <a
                        key={year}
                        href={`#${sectionId(year)}`}
                        className="block py-[5px] no-underline cursor-pointer transition-opacity duration-150"
                    >
                        <p
                            className="text-[9px] font-bold tracking-[0.15em] uppercase mb-px transition-[color,opacity] duration-200 tabular-nums"
                            style={{color: active ? color : "var(--text-4)", opacity: active ? 0.7 : 0.4}}
                        >
                            {edition}
                        </p>
                        <p
                            className="text-xs tabular-nums transition-colors duration-200"
                            style={{
                                fontWeight: active ? 700 : 500,
                                letterSpacing: active ? "-0.02em" : "0",
                                color: active ? color : "var(--text-4)",
                            }}
                        >
                            {year}
                        </p>
                    </a>
                );
            })}
        </aside>
    );
}
