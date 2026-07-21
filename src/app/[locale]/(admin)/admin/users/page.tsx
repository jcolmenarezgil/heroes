import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
  const t = await getTranslations("admin");
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">{t("usersTitle")}</h1>
    </div>
  );
}
