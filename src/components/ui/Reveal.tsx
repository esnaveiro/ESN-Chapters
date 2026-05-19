"use client";

import {type CSSProperties, type ReactNode, useEffect, useRef} from "react";

const SPRING = "cubic-bezier(0.32,0.72,0,1)";

export function Reveal({
                           children,
                           delay = 0,
                           y = 12,
                           style,
                           className,
                       }: {
    children: ReactNode;
    delay?: number;
    y?: number;
    style?: CSSProperties;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.style.transition = `opacity 0.9s ${SPRING} ${delay}ms, transform 0.9s ${SPRING} ${delay}ms`;
            el.style.opacity = "1";
            el.style.transform = "none";
        });
    }, [delay]);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: 0,
                transform: `translateY(${y}px)`,
                ...style,
            }}
        >
            {children}
        </div>
    );
}
