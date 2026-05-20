import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import {AdminNav} from "@/components/admin/AdminNav";

export default async function AdminLayout({
                                              children,
                                          }: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) redirect("/admin/login");

    return (
        <div className="flex min-h-screen bg-[var(--bg)]">
            <AdminNav email={user.email ?? ""}/>
            <main className="flex-1 overflow-auto">
                <div className="px-4 pt-20 pb-20 md:px-10 md:py-10 md:pb-10">{children}</div>
            </main>
        </div>
    );
}
