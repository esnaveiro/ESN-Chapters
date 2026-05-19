import {Nav} from "@/components/public/Nav";

export default function PublicLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Nav/>
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </>
    );
}
