import {createClient, createServiceClient} from "@/lib/supabase/server";
import {NextResponse} from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return NextResponse.json({message: "Unauthorized"}, {status: 401});

    const {userId} = await request.json();
    if (!userId) return NextResponse.json({message: "userId is required"}, {status: 400});
    if (userId === user.id) return NextResponse.json({message: "Cannot revoke your own access"}, {status: 400});

    const serviceClient = await createServiceClient();
    const {error} = await serviceClient.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({message: error.message}, {status: 400});

    return NextResponse.json({message: "Access revoked"});
}
