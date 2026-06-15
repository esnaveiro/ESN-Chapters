import {createClient} from "@/lib/supabase/server";
import type {ActionResult} from "@/types";
import {ValidationError} from "@/lib/validation";

/**
 * Ensures the caller has an authenticated Supabase session.
 * Throws "Unauthorized" otherwise. Use at the top of every server action.
 */
export async function requireAuth() {
    const supabase = await createClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return user;
}

/**
 * Normalises an unknown error caught in a server action into an
 * {@link ActionResult}. The full error is logged server-side for
 * diagnostics while a clean message is returned to the caller.
 */
export function actionError(e: unknown): ActionResult<never> {
    // ValidationError is expected user input — surface it without logging a crash.
    if (!(e instanceof ValidationError)) console.error("[action]", e);
    const message = e instanceof Error ? e.message : String(e);
    return {success: false, error: message};
}
