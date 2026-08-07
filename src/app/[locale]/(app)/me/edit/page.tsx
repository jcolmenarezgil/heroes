"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import UserForm from "@/components/UserForm";
import UserFormSkeleton from "@/components/UserFormSkeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, getMe, updateMe } from "@/lib/api-client";
import type { UserDTO } from "@/types/user";
import type { UpdateUserInput } from "@/lib/validations/user";

export default function EditMyProfilePage() {
  const t = useTranslations("myProfile");
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { addToast } = useToast();

  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    let cancelled = false;

    getMe()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
        } else {
          addToast(t("loadError"), "error");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, addToast, t, router]);

  const handleSubmit = async (data: UpdateUserInput) => {
    try {
      await updateMe(data);
      addToast(t("saveSuccess"), "success");
      router.push("/me");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.push("/login");
          return;
        }
        if (error.status === 400) {
          addToast(error.message || t("saveError"), "error");
          return;
        }
      }
      addToast(t("saveError"), "error");
      throw error;
    }
  };

  if (isLoading || sessionStatus === "loading") {
    return <UserFormSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-white">{t("loadError")}</p>
        <Link href="/" className="mt-4 text-white underline underline-offset-4">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        {t("editTitle")}
      </h1>
      <UserForm
        initialData={user}
        onSubmit={handleSubmit}
        submitLabel={t("actions.save")}
        cancelHref="/me"
      />
    </div>
  );
}
