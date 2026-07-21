import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">{t("dashboardTitle")}</h1>
    </div>
  );
}
