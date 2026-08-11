// Coerce a callback URL to a same-origin relative path. Anything else (null,
// absolute, or protocol-relative) collapses to "/", guarding against
// open-redirects on login.
export function safeCallbackUrl(raw: string | null | undefined): string {
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
    return raw;
}