import { describe, expect, it } from "vitest";
import {
  isAdminPath,
  isProtectedPath,
  stripLocale,
} from "@/lib/route-guards";

describe("stripLocale", () => {
  it("strips /en and /es prefixes", () => {
    expect(stripLocale("/en/directory")).toBe("/directory");
    expect(stripLocale("/es/map")).toBe("/map");
  });

  it("leaves the default locale (no prefix) untouched", () => {
    expect(stripLocale("/directory")).toBe("/directory");
    expect(stripLocale("/")).toBe("/");
  });

  it("returns '/' when the whole path is just the locale", () => {
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/es")).toBe("/");
  });

  it("does not touch other segments starting with /e", () => {
    expect(stripLocale("/export")).toBe("/export");
  });
});

describe("isProtectedPath", () => {
  it("protects the bulk catalog, create, me, edit, notifications", () => {
    expect(isProtectedPath("/directory")).toBe(true);
    expect(isProtectedPath("/map")).toBe(true);
    expect(isProtectedPath("/create")).toBe(true);
    expect(isProtectedPath("/me")).toBe(true);
    expect(isProtectedPath("/me/edit")).toBe(true);
    expect(isProtectedPath("/notifications")).toBe(true);
  });

  it("protects nested profile edits", () => {
    expect(isProtectedPath("/p/11111111-1111-1111-1111-111111111111/edit")).toBe(
      true
    );
  });

  it("leaves public views open", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/p/11111111-1111-1111-1111-111111111111")).toBe(false);
    expect(isProtectedPath("/about")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/centers")).toBe(false);
    expect(isProtectedPath("/protocol")).toBe(false);
  });

  it("does not match near-misses", () => {
    expect(isProtectedPath("/directoryX")).toBe(false);
    expect(isProtectedPath("/mapx")).toBe(false);
    expect(isProtectedPath("/create/extra")).toBe(false);
  });
});

describe("isAdminPath", () => {
  it("matches /admin and any subpath", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/profiles")).toBe(true);
    expect(isAdminPath("/admin/users/abc/role")).toBe(true);
  });

  it("does not match look-alikes", () => {
    expect(isAdminPath("/administrator")).toBe(false);
    expect(isAdminPath("/adminx")).toBe(false);
    expect(isAdminPath("/directory")).toBe(false);
  });
});