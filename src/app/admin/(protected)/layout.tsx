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
                <div className="px-10 py-10">{children}</div>
            </main>
        </div>
    );
}
