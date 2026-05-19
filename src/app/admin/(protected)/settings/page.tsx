import {createClient, createServiceClient} from "@/lib/supabase/server";
import {InviteForm} from "@/components/admin/InviteForm";
import {AdminUserList} from "@/components/admin/AdminUserList";

export default async function AdminSettingsPage() {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();

    const serviceClient = await createServiceClient();
    const {data: usersData} = await serviceClient.auth.admin.listUsers();

    const users = (usersData?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "(no email)",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        isCurrentUser: u.id === user?.id,
    }));

    return (
        <div>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-10">
                Settings
            </h1>

            {/* Admin accounts */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-1">
                    Admin accounts
                </p>
                <p className="text-[12px] text-[var(--text-4)] mb-5">
                    {users.length} {users.length === 1 ? "account" : "accounts"} with access
                </p>
                <AdminUserList users={users}/>
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* Invite */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-4">
                    Invite new admin
                </p>
                <p className="text-[13px] text-[var(--text-3)] mb-5 leading-relaxed">
                    Send an invitation email. The invite link expires in 48 hours.
                </p>
                <InviteForm/>
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* Your account */}
            <section>
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-3">
                    Your account
                </p>
                <p className="text-[13px] text-[var(--text-2)]">{user?.email}</p>
            </section>
        </div>
    );
}
