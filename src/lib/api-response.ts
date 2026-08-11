import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

export function jsonOk<T>(data: T, status = 200) {
    return NextResponse.json({ data }, { status });
}

export function jsonError(error: string, status: number, issues?: ZodIssue[]) {
    return NextResponse.json(
        issues && issues.length > 0 ? { error, issues } : { error },
        { status }
    );
}

export function jsonUnauthorized(message = "Unauthorized") {
    return jsonError(message, 401);
}

export function jsonForbidden(message = "Forbidden") {
    return jsonError(message, 403);
}

export function jsonNotFound(message = "Not found") {
    return jsonError(message, 404);
}

export function jsonBadRequest(message = "Bad request", issues?: ZodIssue[]) {
    return jsonError(message, 400, issues);
}

export function jsonTooManyRequests(
    message = "Too many requests",
    retryAfterSeconds?: number
) {
    const headers = retryAfterSeconds
        ? { "Retry-After": String(retryAfterSeconds) }
        : undefined;
    return NextResponse.json({ error: message }, { status: 429, headers });
}

export function jsonServerError(message = "Internal server error") {
    return jsonError(message, 500);
}
