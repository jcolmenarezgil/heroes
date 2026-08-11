import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/callback-url";

describe("safeCallbackUrl", () => {
    it("returns '/' for null/undefined/empty", () => {
        expect(safeCallbackUrl(null)).toBe("/");
        expect(safeCallbackUrl(undefined)).toBe("/");
        expect(safeCallbackUrl("")).toBe("/");
    });

    it("rejects absolute URLs", () => {
        expect(safeCallbackUrl("https://evil.com")).toBe("/");
        expect(safeCallbackUrl("http://localhost:3000/me")).toBe("/");
    });

    it("rejects protocol-relative URLs", () => {
        expect(safeCallbackUrl("//evil.com")).toBe("/");
        expect(safeCallbackUrl("//evil.com/path")).toBe("/");
    });

    it("rejects values without a leading slash", () => {
        expect(safeCallbackUrl("relative")).toBe("/");
        expect(safeCallbackUrl("directory")).toBe("/");
    });

    it("allows same-origin relative paths", () => {
        expect(safeCallbackUrl("/")).toBe("/");
        expect(safeCallbackUrl("/directory")).toBe("/directory");
        expect(safeCallbackUrl("/p/11111111-1111-1111-1111-111111111111")).toBe(
            "/p/11111111-1111-1111-1111-111111111111"
        );
        expect(safeCallbackUrl("/create?lat=10&lng=-66")).toBe(
            "/create?lat=10&lng=-66"
        );
    });
});