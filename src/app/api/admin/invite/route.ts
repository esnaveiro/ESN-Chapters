import {createClient, createServiceClient} from "@/lib/supabase/server";
import {NextResponse} from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }

    const {email} = await request.json();
    if (!email) {
        return NextResponse.json({message: "Email is required"}, {status: 400});
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const serviceClient = await createServiceClient();
    const {error} = await serviceClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/admin/set-password`,
    });

    if (error) {
        return NextResponse.json({message: error.message}, {status: 400});
    }

    return NextResponse.json({message: `Invitation sent to ${email}`});
}
