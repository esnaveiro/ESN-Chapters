/**
 * Lightweight, dependency-free input guards for server actions.
 *
 * Each helper throws a {@link ValidationError} on bad input. Server actions
 * already wrap their bodies in try/catch and funnel through `actionError`,
 * which surfaces the message to the caller without logging it as a crash.
 */

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

function fail(message: string): never {
    throw new ValidationError(message);
}

/** A required, trimmed, non-empty string within a length bound. */
export function requireText(value: string | undefined | null, field: string, max = 255): string {
    const v = (value ?? "").trim();
    if (!v) fail(`${field} is required.`);
    if (v.length > max) fail(`${field} must be at most ${max} characters.`);
    return v;
}

/** An optional, trimmed string capped at `max`; empty becomes `undefined`. */
export function optionalText(value: string | undefined | null, field: string, max = 5000): string | undefined {
    const v = (value ?? "").trim();
    if (!v) return undefined;
    if (v.length > max) fail(`${field} must be at most ${max} characters.`);
    return v;
}

/** Asserts a parseable date string (rejects "Invalid Date"). */
export function requireDate(value: string | undefined | null, field: string): void {
    if (!value || Number.isNaN(new Date(value).getTime())) fail(`${field} is not a valid date.`);
}

/** Asserts an optional date string is parseable when present. */
export function optionalDate(value: string | undefined | null, field: string): void {
    if (value && Number.isNaN(new Date(value).getTime())) fail(`${field} is not a valid date.`);
}

/** Asserts an optional value, when present, is a valid http(s) URL. */
export function optionalUrl(value: string | undefined | null, field: string): void {
    const v = (value ?? "").trim();
    if (!v) return;
    let url: URL;
    try {
        url = new URL(v);
    } catch {
        return fail(`${field} must be a valid URL.`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        fail(`${field} must be an http(s) URL.`);
    }
}

/** Asserts the value is one of the allowed enum members. */
export function requireEnum<T extends string>(
    value: string | undefined | null,
    allowed: Record<string, T>,
    field: string
): T {
    const values = Object.values(allowed);
    if (!value || !values.includes(value as T)) fail(`${field} is invalid.`);
    return value as T;
}
