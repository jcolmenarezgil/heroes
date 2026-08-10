"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

interface Crumb {
  label: string;
  href?: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  directory: "directory",
  create: "createReport",
  centers: "careCenters",
  map: "map",
  notifications: "notifications",
  protocol: "protocol",
  about: "about",
  me: "myProfile",
  edit: "edit",
  suggest: "suggestUpdate",
};

function buildCrumbs(pathname: string, t: (key: string) => string): Crumb[] {
  const crumbs: Crumb[] = [{ label: t("home"), href: "/" }];
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "p") {
    crumbs.push({ label: t("directory"), href: "/directory" });
    if (segments[1]) {
      const isLeaf = segments.length === 2;
      crumbs.push({
        label: t("profile"),
        href: isLeaf ? undefined : `/p/${segments[1]}`,
      });
      for (const seg of segments.slice(2)) {
        const key = SEGMENT_LABELS[seg];
        if (key) crumbs.push({ label: t(key) });
      }
    }
    return crumbs;
  }

  for (const seg of segments) {
    const key = SEGMENT_LABELS[seg];
    if (!key) continue;
    const isLeaf = seg === segments[segments.length - 1];
    crumbs.push({ label: t(key), href: isLeaf ? undefined : `/${seg}` });
  }

  return crumbs;
}

export default function Breadcrumbs() {
  const t = useTranslations("breadcrumbs");
  const pathname = usePathname();

  if (pathname === "/") return null;

  const crumbs = buildCrumbs(pathname, t);

  return (
    <nav
      aria-label={t("label")}
      className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-neutral-600">
                  ›
                </span>
              )}
              {!isLast && crumb.href ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-white"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-neutral-200">{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
