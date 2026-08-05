import { sql, isNotNull, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/api-auth";
import { db } from "@/lib/db/client";
import { profiles, profileSuggestions, users } from "@/lib/db/schema";

type StatusKey = "active" | "found" | "deceased";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const t = await getTranslations("admin.dashboard");
  const tAdmin = await getTranslations("admin");

  const [
    totalProfilesRow,
    verifiedRow,
    pendingRow,
    totalUsersRow,
    statusRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(isNotNull(profiles.verified)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(profileSuggestions)
      .where(eq(profileSuggestions.status, "pending")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users),
    db
      .select({
        status: profiles.status,
        count: sql<number>`count(*)::int`,
      })
      .from(profiles)
      .groupBy(profiles.status),
  ]);

  const byStatus: Record<StatusKey, number> = {
    active: 0,
    found: 0,
    deceased: 0,
  };
  for (const row of statusRows) {
    byStatus[row.status as StatusKey] = row.count;
  }

  const cards = [
    { value: totalProfilesRow[0]?.count ?? 0, label: t("totalProfiles") },
    { value: byStatus.active, label: t("active") },
    { value: byStatus.found, label: t("found") },
    { value: byStatus.deceased, label: t("deceased") },
    { value: verifiedRow[0]?.count ?? 0, label: t("verified") },
    { value: pendingRow[0]?.count ?? 0, label: t("pendingSuggestions") },
    { value: totalUsersRow[0]?.count ?? 0, label: t("totalUsers") },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {tAdmin("dashboardTitle")}
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          {tAdmin("dashboardSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-neutral-900 bg-neutral-950 p-4"
          >
            <p className="text-3xl font-semibold text-white">{card.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-neutral-400">
              {card.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}