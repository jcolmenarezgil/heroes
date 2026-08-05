import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white">
      <p className="text-6xl font-semibold">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-400">
        {t("notFoundDescription")}
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-900"
      >
        {t("backToHome")}
      </Link>
    </div>
  );
}