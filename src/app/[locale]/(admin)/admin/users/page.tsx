"use client";

import React, { useEffect, useMemo, useOptimistic, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import AvatarPlaceholder from "@/components/ui/AvatarPlaceholder";
import RoleBadge from "@/components/ui/RoleBadge";
import Skeleton from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import {
  MagnifyingGlassIcon,
  SearchEmptyIcon,
} from "@/components/icons";
import {
  ApiError,
  listAdminUsers,
  updateUserRole,
  type ListAdminUsersParams,
} from "@/lib/api-client";
import type { UserDTO } from "@/types/user";

type Role = "viewer" | "rescuer" | "admin";
type RoleFilter = "all" | Role;

interface OptimisticAction {
  id: string;
  role: Role;
}

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const tRoles = useTranslations("admin.roles");
  const tAdmin = useTranslations("admin");
  const format = useFormatter();
  const { addToast } = useToast();
  const { data: session } = useSession();

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [optimisticUsers, applyOptimistic] = useOptimistic<
    UserDTO[],
    OptimisticAction
  >(users, (current, action) =>
    current.map((u) => (u.id === action.id ? { ...u, role: action.role } : u))
  );

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const params: ListAdminUsersParams = { page, limit: 20 };
    if (debouncedSearch) params.q = debouncedSearch;
    if (roleFilter !== "all") params.role = roleFilter;

    listAdminUsers(params)
      .then((res) => {
        if (cancelled) return;
        setUsers(res.users);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          addToast(t("updateRoleError"), "error");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, roleFilter, addToast, t]);

  const handleRoleChange = async (user: UserDTO, newRole: Role) => {
    if (newRole === user.role) return;
    setBusyId(user.id);
    try {
      applyOptimistic({ id: user.id, role: newRole });
      const updated = await updateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      addToast(t("updateRoleSuccess"), "success");
    } catch (error) {
      if (error instanceof ApiError) {
        const msg =
          error.status === 400
            ? t("lastAdminError")
            : t("updateRoleError");
        addToast(msg, "error");
      } else {
        addToast(t("updateRoleError"), "error");
      }
    } finally {
      setBusyId(null);
    }
  };

  const rows = optimisticUsers;
  const currentUserId = session?.user?.id ?? null;

  const displayList = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {tAdmin("usersTitle")}
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          {tAdmin("usersSubtitle")}
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-end gap-3 border-b border-neutral-800 pb-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="admin-users-search"
            className="text-xs font-medium text-neutral-500"
          >
            {t("labelSearch")}
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              id="admin-users-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="input-field max-w-xs rounded-lg py-2 pl-10"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="admin-users-role"
            className="text-xs font-medium text-neutral-500"
          >
            {t("labelRole")}
          </label>
          <select
            id="admin-users-role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as RoleFilter);
              setPage(1);
            }}
            className="input-field max-w-[160px] py-2"
          >
            <option value="all">{t("filterAll")}</option>
            <option value="viewer">{tRoles("viewer")}</option>
            <option value="rescuer">{tRoles("rescuer")}</option>
            <option value="admin">{tRoles("admin")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-900">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-900 bg-neutral-950 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
              <th className="px-4 py-2">{t("columnName")}</th>
              <th className="hidden px-2 py-2 md:table-cell">
                {t("columnEmail")}
              </th>
              <th className="px-2 py-2">{t("columnRole")}</th>
              <th className="hidden px-2 py-2 lg:table-cell">
                {t("columnJoined")}
              </th>
              <th className="px-4 py-2 text-right">{t("columnActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-0">
                    <Skeleton className="h-16 w-full" />
                  </td>
                </tr>
              ))
            ) : displayList.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center py-16 text-center">
                    <SearchEmptyIcon
                      className="h-12 w-12 text-neutral-500"
                      aria-hidden="true"
                    />
                    <p className="mt-4 text-base font-medium text-white">
                      {t("noResults")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayList.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    className="transition hover:bg-neutral-950"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-neutral-900">
                            <Image
                              src={user.image}
                              alt={user.fullName}
                              fill
                              sizes="36px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <AvatarPlaceholder
                            size="sm"
                            className="!h-9 !w-9 rounded-full"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-base font-medium text-white">
                            {user.name || user.fullName}
                            {isSelf && (
                              <span className="ml-2 inline-flex items-center rounded bg-neutral-800 px-1.5 py-0.5 text-xs font-medium text-neutral-300">
                                {t("youBadge")}
                              </span>
                            )}
                          </span>
                          {user.name && user.name !== user.fullName && (
                            <span className="text-xs text-neutral-500">
                              {user.fullName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden truncate px-2 py-3 text-sm text-neutral-400 md:table-cell">
                      {user.email}
                    </td>
                    <td className="px-2 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="hidden px-2 py-3 text-sm text-neutral-400 lg:table-cell">
                      {format.dateTime(new Date(user.createdAt), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <select
                          value={user.role}
                          disabled={isSelf || busyId === user.id}
                          onChange={(e) =>
                            handleRoleChange(user, e.target.value as Role)
                          }
                          title={isSelf ? t("cannotSelf") : undefined}
                          className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="viewer">{tRoles("viewer")}</option>
                          <option value="rescuer">{tRoles("rescuer")}</option>
                          <option value="admin">{tRoles("admin")}</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {t("prevPage")}
          </Button>
          <span className="text-sm text-neutral-400">
            {t("page", { page, totalPages })}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            {t("nextPage")}
          </Button>
        </div>
      )}
    </div>
  );
}