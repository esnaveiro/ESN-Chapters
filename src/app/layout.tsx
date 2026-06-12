import type {Metadata, Viewport} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {APP_TITLE, META_DESC} from "@/lib/config";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-inter",
    display: "swap",
});

export const viewport: Viewport = {
    viewportFit: "cover",
};

export const metadata: Metadata = {
    title: APP_TITLE,
    description: META_DESC,
    icons: {
        icon: "/icons/icon-256.png",
        apple: "/icons/icon-512.png",
    },
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
        <body className="min-h-full flex flex-col">{children}</body>
        </html>
    );
}
