import {type NextRequest, NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const {searchParams, origin} = new URL(request.url);
    const next = searchParams.get("next") ?? "/admin";
    const supabase = await createClient();

    // PKCE flow (used by @supabase/ssr): code exchange
    const code = searchParams.get("code");
    if (code) {
        const {error} = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return NextResponse.redirect(`${origin}${next}`);
    }

    // Fallback: token_hash flow (magic links, older Supabase versions)
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "invite" | "recovery" | "email" | null;
    if (token_hash && type) {
        const {error} = await supabase.auth.verifyOtp({token_hash, type});
        if (!error) return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/admin/login?error=invalid_link`);
}
