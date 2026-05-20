import {Nav} from "@/components/public/Nav";

export default function PublicLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Nav/>
            <main className="flex-1 pb-14 md:pb-0">
            {children}
            <div className="md:hidden" style={{height: "env(safe-area-inset-bottom)"}}/>
        </main>
        </>
    );
}
