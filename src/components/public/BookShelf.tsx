import Link from "next/link";

const BOOKS = [
    {href: "/members", label: "Members", color: "#ec008c", width: 52, height: 196, rotate: -2.5},
    {href: "/mandates", label: "Mandates", color: "#00aeef", width: 48, height: 172, rotate: 0.8},
    {href: "/network", label: "Network", color: "#7ac143", width: 42, height: 184, rotate: -1.2},
] as const;

export function BookShelf() {
    return (
        <div style={{display: "flex", gap: 6, alignItems: "flex-end", perspective: 600}}>
            {BOOKS.map(({href, label, color, width, height, rotate}) => (
                <div
                    key={href}
                    className="hover:-translate-y-3"
                    style={{
                        transition: "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
                        transformOrigin: "bottom center",
                    }}
                >
                    <Link
                        href={href}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            width,
                            height,
                            background: color,
                            borderRadius: "3px 3px 2px 2px",
                            textDecoration: "none",
                            position: "relative",
                            overflow: "hidden",
                            transform: `rotate(${rotate}deg)`,
                            transformOrigin: "bottom center",
                            boxShadow: [
                                "4px 6px 16px rgba(0,0,0,0.3)",
                                "inset 4px 0 0 rgba(255,255,255,0.16)",
                                "inset -2px 0 0 rgba(0,0,0,0.2)",
                            ].join(", "),
                            flexShrink: 0,
                        }}
                    >
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: 4,
                                background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)",
                            }}
                        />
                        <span
                            style={{
                                writingMode: "vertical-lr",
                                transform: "rotate(180deg)",
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.94)",
                                userSelect: "none",
                            }}
                        >
              {label}
            </span>
                    </Link>
                </div>
            ))}
        </div>
    );
}
