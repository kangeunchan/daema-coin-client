import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@daema/ui/badge";
import { Button } from "@daema/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@daema/ui/card";
import { Text } from "@daema/ui/text";

import {
  AdminApiError,
  clearAdminAccessToken,
  createAdminBooth,
  createInternalAccount,
  createRoleAssignment,
  fetchAdminBooths,
  fetchAdminDashboard,
  fetchAdminMe,
  fetchAdminRoles,
  fetchInternalAccounts,
  isAdminApiEnabled,
  loginAdmin,
  logoutAdmin,
  resetInternalAccountPassword,
  updateAdminBooth,
  updateInternalAccount,
} from "./api";
import type { AdminBooth, AdminDashboard, AdminRole, AdminUser, InternalAccount } from "./api";

type AdminView = "accounts" | "booths" | "permissions" | "security";
type AccountRole = "admin" | "booth" | "teacher";
type AccountStatus = "active" | "disabled" | "locked";

const statusLabels: Record<string, string> = {
  active: "활성",
  disabled: "비활성",
  locked: "잠김",
};

const boothStatusLabels: Record<string, string> = {
  active: "운영",
  closed: "마감",
  disabled: "비활성",
  draft: "초안",
  open: "운영",
  paused: "중지",
  ready: "준비",
};

const roleLabels: Record<string, string> = {
  admin: "관리자",
  booth: "부스",
  teacher: "티처",
};

const navItems: Array<{ icon: typeof Users; id: AdminView; label: string }> = [
  { icon: Users, id: "accounts", label: "계정" },
  { icon: Store, id: "booths", label: "부스" },
  { icon: ShieldCheck, id: "permissions", label: "권한" },
  { icon: KeyRound, id: "security", label: "보안" },
];

const pageMeta: Record<
  AdminView,
  { breadcrumb: string; description: string; section: string; title: string }
> = {
  accounts: {
    breadcrumb: "운영 / 내부 계정",
    description: "관리자와 부스 운영 계정을 발급하고 접근 상태를 관리합니다.",
    section: "계정 접근 관리",
    title: "내부 계정 관리",
  },
  booths: {
    breadcrumb: "운영 / 부스",
    description: "축제 현장 부스를 등록하고 운영 상태, 위치, 부스 계정 연결 상태를 확인합니다.",
    section: "부스 운영 관리",
    title: "부스 운영 관리",
  },
  permissions: {
    breadcrumb: "운영 / 권한",
    description: "역할 카탈로그를 확인하고 부스 계정이 접근할 운영 범위를 연결합니다.",
    section: "권한 및 범위",
    title: "권한 범위 관리",
  },
  security: {
    breadcrumb: "운영 / 보안",
    description: "잠긴 계정, 비밀번호 변경 요구, 초기화 작업을 한 화면에서 처리합니다.",
    section: "접근 보안",
    title: "보안 작업 센터",
  },
};

const emptyAccountDraft = {
  boothId: "",
  displayName: "",
  loginId: "",
  password: "",
  role: "booth" as AccountRole,
};

const emptyBoothDraft = {
  boothId: "",
  categoryId: "",
  description: "",
  festivalId: "",
  locationLabel: "",
  name: "",
  status: "ready",
};

const emptyScopeDraft = {
  accountId: "",
  boothId: "",
};

const emptyRoleAssignmentDraft = {
  accountId: "",
  boothId: "",
  roleId: "",
  scope: "global",
};

const fallbackRoles: readonly AdminRole[] = [
  {
    description: "관리자 콘솔 전체 접근, 내부 계정 발급, 부스 운영 데이터 수정",
    id: "admin",
    name: "관리자",
    status: "system",
  },
  {
    description: "부스 앱 로그인, 판매/정산/공지 등 연결된 부스 범위 접근",
    id: "booth",
    name: "부스 운영자",
    status: "system",
  },
  {
    description: "컨슈머 teacher 경로 로그인, 테스트 결제와 예측을 위한 무제한 잔액 접근",
    id: "teacher",
    name: "티처",
    status: "system",
  },
];

function errorMessage(error: unknown) {
  if (error instanceof AdminApiError) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
}

function formatDateTime(value: string | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}

function stringValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const nextValue = stringValue(value).trim();
    if (nextValue) {
      return nextValue;
    }
  }

  return "";
}

function accountName(account: InternalAccount) {
  return account.displayName || account.loginId;
}

function AccountRoleIcon({ role }: { role: string }) {
  if (role === "admin") {
    return <ShieldCheck aria-hidden="true" />;
  }

  if (role === "teacher") {
    return <GraduationCap aria-hidden="true" />;
  }

  return <Store aria-hidden="true" />;
}

function boothIdOf(booth: AdminBooth) {
  return firstString(booth.id, booth.boothId);
}

function boothNameOf(booth: AdminBooth) {
  return firstString(booth.name, booth.displayName, booth.title, boothIdOf(booth), "이름 없는 부스");
}

function boothLocationOf(booth: AdminBooth) {
  return firstString(booth.locationLabel, booth.location, booth.zone, "-");
}

function boothStatusOf(booth: AdminBooth) {
  return firstString(booth.status, "ready");
}

function roleIdOf(role: AdminRole) {
  return firstString(role.id, role.role, role.code, role.name);
}

function roleNameOf(role: AdminRole) {
  return firstString(role.name, role.role, role.code, role.id, "역할");
}

function roleDescriptionOf(role: AdminRole) {
  return firstString(role.description, "세부 설명이 등록되지 않았습니다.");
}

export function App() {
  const [session, setSession] = useState<AdminUser | undefined>();
  const [accounts, setAccounts] = useState<readonly InternalAccount[]>([]);
  const [booths, setBooths] = useState<readonly AdminBooth[]>([]);
  const [roles, setRoles] = useState<readonly AdminRole[]>([]);
  const [dashboard, setDashboard] = useState<AdminDashboard | undefined>();
  const [activeView, setActiveView] = useState<AdminView>("accounts");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [newAccount, setNewAccount] = useState(emptyAccountDraft);
  const [newBooth, setNewBooth] = useState(emptyBoothDraft);
  const [scopeDraft, setScopeDraft] = useState(emptyScopeDraft);
  const [roleAssignmentDraft, setRoleAssignmentDraft] = useState(emptyRoleAssignmentDraft);
  const [query, setQuery] = useState("");
  const [boothQuery, setBoothQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AccountRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AccountStatus>("all");
  const [boothStatusFilter, setBoothStatusFilter] = useState<string>("all");
  const [resetTargetId, setResetTargetId] = useState<string | undefined>();
  const [resetPassword, setResetPassword] = useState("");
  const [isChecking, setIsChecking] = useState(() => isAdminApiEnabled());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingBooth, setIsCreatingBooth] = useState(false);
  const [isSavingScope, setIsSavingScope] = useState(false);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rowActionId, setRowActionId] = useState<string | undefined>();
  const [boothActionId, setBoothActionId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const loadAdminData = async () => {
    const [nextAccounts, nextBooths, nextRoles, nextDashboard] = await Promise.all([
      fetchInternalAccounts(),
      fetchAdminBooths(),
      fetchAdminRoles(),
      fetchAdminDashboard(),
    ]);

    setAccounts(nextAccounts);
    setBooths(nextBooths);
    setRoles(nextRoles);
    setDashboard(nextDashboard);

    return {
      accounts: nextAccounts,
      booths: nextBooths,
      dashboard: nextDashboard,
      roles: nextRoles,
    };
  };

  useEffect(() => {
    if (!isAdminApiEnabled()) {
      return;
    }

    let isActive = true;

    void fetchAdminMe()
      .then(async (nextSession) => {
        if (!isActive) {
          return;
        }

        if (nextSession.role !== "admin") {
          clearAdminAccessToken();
          return;
        }

        setSession(nextSession);
        await loadAdminData();
      })
      .catch((nextError) => {
        if (isActive && !(nextError instanceof AdminApiError && nextError.status === 401)) {
          setError(errorMessage(nextError));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const roleCatalog = roles.length > 0 ? roles : fallbackRoles;

  const boothAccounts = useMemo(
    () => accounts.filter((account) => account.role === "booth"),
    [accounts],
  );

  const counts = useMemo(() => {
    const active = accounts.filter((account) => account.status === "active").length;
    const admins = accounts.filter((account) => account.role === "admin").length;
    const teachers = accounts.filter((account) => account.role === "teacher").length;
    const boothAccountCount = boothAccounts.length;
    const linkedBoothAccounts = boothAccounts.filter((account) => account.boothId).length;
    const locked = accounts.filter((account) => account.status === "locked").length;
    const disabled = accounts.filter((account) => account.status === "disabled").length;
    const forcePasswordChanges = accounts.filter((account) => account.forcePasswordChange).length;
    const activeBooths = booths.filter((booth) =>
      ["active", "open"].includes(boothStatusOf(booth)),
    ).length;
    const readyBooths = booths.filter((booth) =>
      ["draft", "ready"].includes(boothStatusOf(booth)),
    ).length;

    return {
      active,
      activeBooths,
      admins,
      boothAccounts: boothAccountCount,
      booths: dashboard?.boothCount ?? booths.length,
      disabled,
      forcePasswordChanges,
      linkedBoothAccounts,
      locked,
      readyBooths,
      roles: roleCatalog.length,
      teachers,
      total: accounts.length,
    };
  }, [accounts, boothAccounts, booths, dashboard?.boothCount, roleCatalog.length]);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

    return accounts.filter((account) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [account.loginId, account.displayName, account.boothId, account.id].some((value) =>
          value?.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
        );
      const matchesRole = roleFilter === "all" || account.role === roleFilter;
      const matchesStatus = statusFilter === "all" || account.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [accounts, query, roleFilter, statusFilter]);

  const filteredBooths = useMemo(() => {
    const normalizedQuery = boothQuery.trim().toLocaleLowerCase("ko-KR");

    return booths.filter((booth) => {
      const status = boothStatusOf(booth);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          boothIdOf(booth),
          boothNameOf(booth),
          boothLocationOf(booth),
          booth.festivalId,
          booth.categoryId,
          booth.sellerId,
        ].some((value) => stringValue(value).toLocaleLowerCase("ko-KR").includes(normalizedQuery));
      const matchesStatus = boothStatusFilter === "all" || status === boothStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [boothQuery, boothStatusFilter, booths]);

  const securityAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.status === "locked" ||
          account.status === "disabled" ||
          account.forcePasswordChange,
      ),
    [accounts],
  );

  const summaryCards = useMemo(() => {
    if (activeView === "booths") {
      return [
        { icon: Store, label: "등록 부스", value: counts.booths },
        { icon: CheckCircle2, label: "운영 중", value: counts.activeBooths },
        { icon: RefreshCw, label: "준비/초안", value: counts.readyBooths },
        { icon: Users, label: "연결 계정", value: counts.linkedBoothAccounts },
      ];
    }

    if (activeView === "permissions") {
      return [
        { icon: ShieldCheck, label: "역할 정의", value: counts.roles },
        { icon: Users, label: "관리자 계정", value: counts.admins },
        { icon: Store, label: "부스 계정", value: counts.boothAccounts },
        { icon: GraduationCap, label: "티처 계정", value: counts.teachers },
      ];
    }

    if (activeView === "security") {
      return [
        { icon: AlertCircle, label: "잠긴 계정", value: counts.locked },
        { icon: KeyRound, label: "비밀번호 변경 요구", value: counts.forcePasswordChanges },
        { icon: Users, label: "비활성 계정", value: counts.disabled },
        { icon: CheckCircle2, label: "활성 계정", value: counts.active },
      ];
    }

    return [
      { icon: Users, label: "전체 계정", value: counts.total },
      { icon: ShieldCheck, label: "관리자", value: counts.admins },
      { icon: Store, label: "부스 계정", value: counts.boothAccounts },
      { icon: GraduationCap, label: "티처 계정", value: counts.teachers },
    ];
  }, [activeView, counts]);

  const currentPage = pageMeta[activeView];

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError(undefined);
    setNotice(undefined);

    try {
      const nextSession = await loginAdmin(loginId.trim(), password);
      if (nextSession.role !== "admin") {
        clearAdminAccessToken();
        throw new AdminApiError("관리자 권한 계정만 사용할 수 있습니다.", 403, "ADMIN_ROLE_REQUIRED");
      }

      setSession(nextSession);
      setPassword("");
      await loadAdminData();
      setNotice("관리자 세션이 연결되었습니다.");
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(undefined);
    setNotice(undefined);

    try {
      const loaded = await loadAdminData();
      setNotice(
        `데이터를 새로 불러왔습니다. 계정 ${loaded.accounts.length.toLocaleString(
          "ko-KR",
        )}개, 부스 ${loaded.booths.length.toLocaleString("ko-KR")}개가 표시됩니다.`,
      );
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setError(undefined);
    setNotice(undefined);

    const payload: Parameters<typeof createInternalAccount>[0] = {
      displayName: newAccount.displayName.trim(),
      forcePasswordChange: true,
      loginId: newAccount.loginId.trim(),
      password: newAccount.password,
      role: newAccount.role,
    };

    if (newAccount.role === "booth") {
      payload.boothId = newAccount.boothId.trim();
    }

    try {
      const created = await createInternalAccount(payload);
      setNewAccount(emptyAccountDraft);
      await loadAdminData();
      setNotice(`${accountName(created)} 계정을 발급했습니다. 초기 비밀번호를 담당자에게 전달하세요.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateBooth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingBooth(true);
    setError(undefined);
    setNotice(undefined);

    const payload: Parameters<typeof createAdminBooth>[0] = {
      name: newBooth.name.trim(),
      status: newBooth.status,
    };
    const boothId = newBooth.boothId.trim();
    const festivalId = newBooth.festivalId.trim();
    const categoryId = newBooth.categoryId.trim();
    const locationLabel = newBooth.locationLabel.trim();
    const description = newBooth.description.trim();

    if (boothId) {
      payload.boothId = boothId;
    }
    if (festivalId) {
      payload.festivalId = festivalId;
    }
    if (categoryId) {
      payload.categoryId = categoryId;
    }
    if (locationLabel) {
      payload.locationLabel = locationLabel;
    }
    if (description) {
      payload.description = description;
    }

    try {
      const created = await createAdminBooth(payload);
      setNewBooth(emptyBoothDraft);
      await loadAdminData();
      setNotice(`${boothNameOf(created)} 부스를 등록했습니다. 부스 계정과 연결하면 셀러 앱에서 접근할 수 있습니다.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsCreatingBooth(false);
    }
  };

  const handleStatusChange = async (account: InternalAccount, status: AccountStatus) => {
    setRowActionId(account.id);
    setError(undefined);
    setNotice(undefined);

    try {
      const updated = await updateInternalAccount(account.id, { status });
      setAccounts((current) => current.map((item) => (item.id === account.id ? updated : item)));
      setNotice(`${accountName(updated)} 상태를 ${statusLabels[updated.status] ?? updated.status}(으)로 변경했습니다.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setRowActionId(undefined);
    }
  };

  const handleBoothStatusChange = async (booth: AdminBooth, status: string) => {
    const id = boothIdOf(booth);
    if (!id) {
      setError("부스 ID가 없어 상태를 변경할 수 없습니다.");
      return;
    }

    setBoothActionId(id);
    setError(undefined);
    setNotice(undefined);

    try {
      const updated = await updateAdminBooth(id, { status });
      setBooths((current) => current.map((item) => (boothIdOf(item) === id ? updated : item)));
      setNotice(`${boothNameOf(updated)} 상태를 ${boothStatusLabels[status] ?? status}(으)로 변경했습니다.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setBoothActionId(undefined);
    }
  };

  const handleForcePasswordChange = async (account: InternalAccount) => {
    setRowActionId(account.id);
    setError(undefined);
    setNotice(undefined);

    try {
      const updated = await updateInternalAccount(account.id, {
        forcePasswordChange: !account.forcePasswordChange,
      });
      setAccounts((current) => current.map((item) => (item.id === account.id ? updated : item)));
      setNotice(`${accountName(updated)}의 비밀번호 변경 요구 상태를 저장했습니다.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setRowActionId(undefined);
    }
  };

  const handleAssignBoothScope = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingScope(true);
    setError(undefined);
    setNotice(undefined);

    try {
      const updated = await updateInternalAccount(scopeDraft.accountId, {
        boothId: scopeDraft.boothId,
      });
      setAccounts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setScopeDraft(emptyScopeDraft);
      setNotice(`${accountName(updated)} 계정을 부스 ${updated.boothId ?? "-"}에 연결했습니다.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsSavingScope(false);
    }
  };

  const handleClearBoothScope = async (account: InternalAccount) => {
    setRowActionId(account.id);
    setError(undefined);
    setNotice(undefined);

    try {
      const updated = await updateInternalAccount(account.id, { boothId: "" });
      setAccounts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`${accountName(updated)} 계정의 부스 연결을 해제했습니다.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setRowActionId(undefined);
    }
  };

  const handleCreateRoleAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAssigningRole(true);
    setError(undefined);
    setNotice(undefined);

    const payload: Parameters<typeof createRoleAssignment>[0] = {
      accountId: roleAssignmentDraft.accountId,
      roleId: roleAssignmentDraft.roleId,
      scope: roleAssignmentDraft.scope,
    };

    if (roleAssignmentDraft.scope === "booth" && roleAssignmentDraft.boothId) {
      payload.boothId = roleAssignmentDraft.boothId;
    }

    try {
      await createRoleAssignment(payload);
      setRoleAssignmentDraft(emptyRoleAssignmentDraft);
      setNotice("권한 할당 요청을 저장했습니다.");
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsAssigningRole(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>, account: InternalAccount) => {
    event.preventDefault();
    setRowActionId(account.id);
    setError(undefined);
    setNotice(undefined);

    try {
      const updated = await resetInternalAccountPassword(account.id, resetPassword);
      setAccounts((current) => current.map((item) => (item.id === account.id ? updated : item)));
      setResetPassword("");
      setResetTargetId(undefined);
      setNotice(`${accountName(updated)}의 비밀번호를 초기화했습니다.`);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setRowActionId(undefined);
    }
  };

  const handleLogout = () => {
    void logoutAdmin().finally(() => {
      setSession(undefined);
      setAccounts([]);
      setBooths([]);
      setRoles([]);
      setDashboard(undefined);
      setNotice(undefined);
      setError(undefined);
      setActiveView("accounts");
    });
  };

  if (isChecking) {
    return (
      <main className="app">
        <section className="admin-panel" aria-label="관리자 앱 확인 중">
          <Text color="muted">세션 확인 중</Text>
        </section>
      </main>
    );
  }

  if (!isAdminApiEnabled()) {
    return (
      <main className="app">
        <section className="admin-panel" aria-label="관리자 API 설정 필요">
          <Badge intent="brand">Admin</Badge>
          <h1>관리자 API 설정 필요</h1>
          <p>VITE_ADMIN_API_BASE_URL을 /api로 끝나는 백엔드 주소로 설정하세요.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app">
        <Card asChild className="admin-login" padding="lg">
          <form aria-label="관리자 로그인" onSubmit={handleLogin}>
            <CardHeader>
              <Badge intent="brand">Admin</Badge>
              <CardTitle>관리자 로그인</CardTitle>
              <CardDescription>발급받은 내부 관리자 계정으로 접속합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="admin-field">
                <span>계정 ID</span>
                <input
                  autoComplete="username"
                  onChange={(event) => {
                    setLoginId(event.currentTarget.value);
                  }}
                  required
                  value={loginId}
                />
              </label>
              <label className="admin-field">
                <span>비밀번호</span>
                <input
                  autoComplete="current-password"
                  minLength={10}
                  onChange={(event) => {
                    setPassword(event.currentTarget.value);
                  }}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error ? (
                <p className="admin-message admin-message--error">
                  <AlertCircle aria-hidden="true" />
                  {error}
                </p>
              ) : null}
              <Button className="admin-submit" disabled={isLoggingIn} type="submit">
                {isLoggingIn ? "확인 중" : "로그인"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <div className="admin-console">
      <aside className="admin-sidebar" aria-label="관리자 내비게이션">
        <div className="admin-sidebar__brand">
          <span className="admin-brand-mark">d</span>
          <div>
            <strong>Daema</strong>
            <small>Admin Console</small>
          </div>
        </div>
        <nav className="admin-nav" aria-label="관리자 메뉴">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                aria-current={activeView === item.id ? "page" : undefined}
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setError(undefined);
                  setNotice(undefined);
                }}
                type="button"
              >
                <Icon aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="admin-sidebar__session">
          <span>Signed in</span>
          <strong>{session.user?.login ?? session.user?.name ?? "admin"}</strong>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <div>
            <span>{currentPage.breadcrumb}</span>
            <strong>{currentPage.section}</strong>
          </div>
          <div className="admin-topbar__actions">
            <Button
              disabled={isRefreshing}
              intent="secondary"
              onClick={handleRefresh}
              type="button"
            >
              <RefreshCw aria-hidden="true" />
              새로고침
            </Button>
            <Button intent="secondary" onClick={handleLogout} type="button">
              <LogOut aria-hidden="true" />
              로그아웃
            </Button>
          </div>
        </header>

        <section className="admin-page-heading" aria-labelledby="admin-title">
          <div>
            <Badge intent="brand">Admin</Badge>
            <h1 id="admin-title">{currentPage.title}</h1>
            <p>{currentPage.description}</p>
          </div>
          <dl className="admin-health-strip">
            <div>
              <dt>API</dt>
              <dd>연결됨</dd>
            </div>
            <div>
              <dt>세션</dt>
              <dd>12h</dd>
            </div>
          </dl>
        </section>

        <section className="admin-metrics" aria-label={`${currentPage.title} 요약`}>
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.label}>
                <Icon aria-hidden="true" />
                <span>{card.label}</span>
                <strong>{card.value.toLocaleString("ko-KR")}</strong>
              </article>
            );
          })}
        </section>

        {notice ? (
          <p className="admin-message admin-message--success" role="status">
            <CheckCircle2 aria-hidden="true" />
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="admin-message admin-message--error" role="alert">
            <AlertCircle aria-hidden="true" />
            {error}
          </p>
        ) : null}

        {activeView === "accounts" ? (
          <section className="admin-workspace">
            <Card asChild className="admin-create" padding="lg">
              <form aria-label="내부 계정 생성" onSubmit={handleCreateAccount}>
                <CardHeader>
                  <CardTitle>계정 발급</CardTitle>
                  <CardDescription>
                    부스 계정은 셀러 앱, 티처 계정은 컨슈머 /teacher 로그인에 사용합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="admin-segmented" role="group" aria-label="발급할 계정 역할">
                    <button
                      aria-pressed={newAccount.role === "booth"}
                      onClick={() => {
                        setNewAccount((value) => ({ ...value, role: "booth" }));
                      }}
                      type="button"
                    >
                      <Store aria-hidden="true" />
                      부스
                    </button>
                    <button
                      aria-pressed={newAccount.role === "admin"}
                      onClick={() => {
                        setNewAccount((value) => ({ ...value, boothId: "", role: "admin" }));
                      }}
                      type="button"
                    >
                      <ShieldCheck aria-hidden="true" />
                      관리자
                    </button>
                    <button
                      aria-pressed={newAccount.role === "teacher"}
                      onClick={() => {
                        setNewAccount((value) => ({ ...value, boothId: "", role: "teacher" }));
                      }}
                      type="button"
                    >
                      <GraduationCap aria-hidden="true" />
                      티처
                    </button>
                  </div>

                  <label className="admin-field">
                    <span>계정 ID</span>
                    <input
                      autoComplete="off"
                      onChange={(event) => {
                        const nextLoginId = event.currentTarget.value;
                        setNewAccount((value) => ({ ...value, loginId: nextLoginId }));
                      }}
                      placeholder={newAccount.role === "teacher" ? "teacher-math-01" : "booth-cafe-01"}
                      required
                      value={newAccount.loginId}
                    />
                  </label>
                  <label className="admin-field">
                    <span>표시 이름</span>
                    <input
                      onChange={(event) => {
                        const nextDisplayName = event.currentTarget.value;
                        setNewAccount((value) => ({
                          ...value,
                          displayName: nextDisplayName,
                        }));
                      }}
                      placeholder={newAccount.role === "teacher" ? "수학 담당 티처" : "청량 카페"}
                      required
                      value={newAccount.displayName}
                    />
                  </label>
                  {newAccount.role === "booth" ? (
                    <label className="admin-field">
                      <span>부스 ID</span>
                      <input
                        onChange={(event) => {
                          const nextBoothId = event.currentTarget.value;
                          setNewAccount((value) => ({
                            ...value,
                            boothId: nextBoothId,
                          }));
                        }}
                        placeholder="booth-cafe-01"
                        required
                        value={newAccount.boothId}
                      />
                    </label>
                  ) : null}
                  <label className="admin-field">
                    <span>초기 비밀번호</span>
                    <input
                      autoComplete="new-password"
                      minLength={10}
                      onChange={(event) => {
                        const nextPassword = event.currentTarget.value;
                        setNewAccount((value) => ({
                          ...value,
                          password: nextPassword,
                        }));
                      }}
                      placeholder="10자 이상"
                      required
                      type="password"
                      value={newAccount.password}
                    />
                  </label>
                  <Button className="admin-submit" disabled={isCreating} type="submit">
                    <UserCog aria-hidden="true" />
                    {isCreating ? "발급 중" : `${roleLabels[newAccount.role]} 계정 발급`}
                  </Button>
                </CardContent>
              </form>
            </Card>

            <section className="admin-account-list" aria-label="내부 계정 목록">
              <div className="admin-account-list__header">
                <div>
                  <span>Directory</span>
                  <h2>발급 계정</h2>
                </div>
                <strong>{filteredAccounts.length.toLocaleString("ko-KR")}개 표시</strong>
              </div>

              <div className="admin-toolbar">
                <label>
                  <Search aria-hidden="true" />
                  <input
                    aria-label="계정 검색"
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    placeholder="계정 ID, 이름, 부스 ID 검색"
                    value={query}
                  />
                </label>
                <select
                  aria-label="역할 필터"
                  onChange={(event) => setRoleFilter(event.currentTarget.value as typeof roleFilter)}
                  value={roleFilter}
                >
                  <option value="all">모든 역할</option>
                  <option value="admin">관리자</option>
                  <option value="booth">부스</option>
                  <option value="teacher">티처</option>
                </select>
                <select
                  aria-label="상태 필터"
                  onChange={(event) =>
                    setStatusFilter(event.currentTarget.value as typeof statusFilter)
                  }
                  value={statusFilter}
                >
                  <option value="all">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="disabled">비활성</option>
                  <option value="locked">잠김</option>
                </select>
              </div>

              <div className="admin-account-table" role="table">
                <div className="admin-account-row admin-account-row--head" role="row">
                  <span>계정</span>
                  <span>역할</span>
                  <span>상태</span>
                  <span>부스</span>
                  <span>최근 로그인</span>
                  <span>작업</span>
                </div>
                {filteredAccounts.map((account) => {
                  const isBusy = rowActionId === account.id;
                  const isResetting = resetTargetId === account.id;

                  return (
                    <article className="admin-account-row" key={account.id} role="row">
                      <div className="admin-account-cell admin-account-cell--identity">
                        <span data-role={account.role}>
                          <AccountRoleIcon role={account.role} />
                        </span>
                        <div>
                          <strong>{accountName(account)}</strong>
                          <small>{account.loginId}</small>
                        </div>
                      </div>
                      <span className="admin-role-pill" data-role={account.role}>
                        {roleLabels[account.role] ?? account.role}
                      </span>
                      <label className="admin-status-select" data-status={account.status}>
                        <span className="admin-sr-only">{account.loginId} 상태</span>
                        <select
                          disabled={isBusy}
                          onChange={(event) => {
                            void handleStatusChange(
                              account,
                              event.currentTarget.value as AccountStatus,
                            );
                          }}
                          value={account.status}
                        >
                          <option value="active">활성</option>
                          <option value="disabled">비활성</option>
                          <option value="locked">잠김</option>
                        </select>
                      </label>
                      <span className="admin-muted-cell">{account.boothId || "-"}</span>
                      <span className="admin-muted-cell">{formatDateTime(account.lastLoginAt)}</span>
                      <div className="admin-row-actions">
                        <button
                          aria-pressed={account.forcePasswordChange ? "true" : "false"}
                          disabled={isBusy}
                          onClick={() => {
                            void handleForcePasswordChange(account);
                          }}
                          type="button"
                        >
                          <KeyRound aria-hidden="true" />
                          {account.forcePasswordChange ? "변경 요구" : "변경 선택"}
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => {
                            setResetTargetId(isResetting ? undefined : account.id);
                            setResetPassword("");
                          }}
                          type="button"
                        >
                          비밀번호 초기화
                        </button>
                      </div>
                      {isResetting ? (
                        <form
                          className="admin-reset-form"
                          onSubmit={(event) => {
                            void handleResetPassword(event, account);
                          }}
                        >
                          <label>
                            <span className="admin-sr-only">{account.loginId} 새 비밀번호</span>
                            <input
                              autoComplete="new-password"
                              minLength={10}
                              onChange={(event) => setResetPassword(event.currentTarget.value)}
                              placeholder="새 비밀번호 10자 이상"
                              required
                              type="password"
                              value={resetPassword}
                            />
                          </label>
                          <button disabled={isBusy} type="submit">
                            저장
                          </button>
                        </form>
                      ) : null}
                    </article>
                  );
                })}
                {filteredAccounts.length === 0 ? (
                  <div className="admin-empty-row">
                    <Search aria-hidden="true" />
                    <strong>조건에 맞는 계정이 없습니다.</strong>
                    <span>검색어나 필터를 바꿔 다시 확인하세요.</span>
                  </div>
                ) : null}
              </div>
            </section>
          </section>
        ) : null}

        {activeView === "booths" ? (
          <section className="admin-workspace">
            <Card asChild className="admin-create" padding="lg">
              <form aria-label="부스 생성" onSubmit={handleCreateBooth}>
                <CardHeader>
                  <CardTitle>부스 등록</CardTitle>
                  <CardDescription>셀러 앱과 연결할 부스 ID, 위치, 운영 상태를 등록합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <label className="admin-field">
                    <span>부스 ID</span>
                    <input
                      autoComplete="off"
                      onChange={(event) => {
                        const nextBoothId = event.currentTarget.value;
                        setNewBooth((value) => ({ ...value, boothId: nextBoothId }));
                      }}
                      placeholder="booth-cafe-01"
                      required
                      value={newBooth.boothId}
                    />
                  </label>
                  <label className="admin-field">
                    <span>부스 이름</span>
                    <input
                      onChange={(event) => {
                        const nextName = event.currentTarget.value;
                        setNewBooth((value) => ({ ...value, name: nextName }));
                      }}
                      placeholder="청량 카페"
                      required
                      value={newBooth.name}
                    />
                  </label>
                  <label className="admin-field">
                    <span>위치</span>
                    <input
                      onChange={(event) => {
                        const nextLocation = event.currentTarget.value;
                        setNewBooth((value) => ({ ...value, locationLabel: nextLocation }));
                      }}
                      placeholder="운동장 A-03"
                      value={newBooth.locationLabel}
                    />
                  </label>
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>축제 ID</span>
                      <input
                        onChange={(event) => {
                          const nextFestivalId = event.currentTarget.value;
                          setNewBooth((value) => ({ ...value, festivalId: nextFestivalId }));
                        }}
                        placeholder="festival-2026"
                        value={newBooth.festivalId}
                      />
                    </label>
                    <label className="admin-field">
                      <span>카테고리 ID</span>
                      <input
                        onChange={(event) => {
                          const nextCategoryId = event.currentTarget.value;
                          setNewBooth((value) => ({ ...value, categoryId: nextCategoryId }));
                        }}
                        placeholder="food"
                        value={newBooth.categoryId}
                      />
                    </label>
                  </div>
                  <label className="admin-field">
                    <span>상태</span>
                    <select
                      onChange={(event) => {
                        const nextStatus = event.currentTarget.value;
                        setNewBooth((value) => ({ ...value, status: nextStatus }));
                      }}
                      value={newBooth.status}
                    >
                      <option value="draft">초안</option>
                      <option value="ready">준비</option>
                      <option value="open">운영</option>
                      <option value="paused">중지</option>
                      <option value="closed">마감</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>설명</span>
                    <textarea
                      onChange={(event) => {
                        const nextDescription = event.currentTarget.value;
                        setNewBooth((value) => ({ ...value, description: nextDescription }));
                      }}
                      placeholder="운영 메모 또는 판매 품목 요약"
                      rows={4}
                      value={newBooth.description}
                    />
                  </label>
                  <Button className="admin-submit" disabled={isCreatingBooth} type="submit">
                    <Store aria-hidden="true" />
                    {isCreatingBooth ? "등록 중" : "부스 등록"}
                  </Button>
                </CardContent>
              </form>
            </Card>

            <section className="admin-account-list" aria-label="부스 목록">
              <div className="admin-account-list__header">
                <div>
                  <span>Booths</span>
                  <h2>운영 부스</h2>
                </div>
                <strong>{filteredBooths.length.toLocaleString("ko-KR")}개 표시</strong>
              </div>
              <div className="admin-toolbar admin-toolbar--booths">
                <label>
                  <Search aria-hidden="true" />
                  <input
                    aria-label="부스 검색"
                    onChange={(event) => setBoothQuery(event.currentTarget.value)}
                    placeholder="부스명, 위치, 부스 ID 검색"
                    value={boothQuery}
                  />
                </label>
                <select
                  aria-label="부스 상태 필터"
                  onChange={(event) => setBoothStatusFilter(event.currentTarget.value)}
                  value={boothStatusFilter}
                >
                  <option value="all">모든 상태</option>
                  <option value="draft">초안</option>
                  <option value="ready">준비</option>
                  <option value="open">운영</option>
                  <option value="paused">중지</option>
                  <option value="closed">마감</option>
                </select>
              </div>

              <div className="admin-booth-grid">
                {filteredBooths.map((booth) => {
                  const boothId = boothIdOf(booth);
                  const status = boothStatusOf(booth);
                  const linkedAccounts = boothAccounts.filter((account) => account.boothId === boothId);
                  const isBusy = boothActionId === boothId;

                  return (
                    <article className="admin-booth-card" key={boothId || boothNameOf(booth)}>
                      <div className="admin-booth-card__header">
                        <div>
                          <span className="admin-booth-icon">
                            <Store aria-hidden="true" />
                          </span>
                          <div>
                            <strong>{boothNameOf(booth)}</strong>
                            <small>{boothId || "ID 없음"}</small>
                          </div>
                        </div>
                        <label className="admin-status-select" data-status={status}>
                          <span className="admin-sr-only">{boothNameOf(booth)} 상태</span>
                          <select
                            disabled={isBusy || !boothId}
                            onChange={(event) => {
                              void handleBoothStatusChange(booth, event.currentTarget.value);
                            }}
                            value={status}
                          >
                            {status in boothStatusLabels ? null : (
                              <option value={status}>{status}</option>
                            )}
                            <option value="draft">초안</option>
                            <option value="ready">준비</option>
                            <option value="open">운영</option>
                            <option value="paused">중지</option>
                            <option value="closed">마감</option>
                          </select>
                        </label>
                      </div>
                      <dl className="admin-detail-list">
                        <div>
                          <dt>위치</dt>
                          <dd>{boothLocationOf(booth)}</dd>
                        </div>
                        <div>
                          <dt>축제</dt>
                          <dd>{stringValue(booth.festivalId) || "-"}</dd>
                        </div>
                        <div>
                          <dt>카테고리</dt>
                          <dd>{stringValue(booth.categoryId) || "-"}</dd>
                        </div>
                        <div>
                          <dt>연결 계정</dt>
                          <dd>
                            {linkedAccounts.length > 0
                              ? linkedAccounts.map((account) => account.loginId).join(", ")
                              : "-"}
                          </dd>
                        </div>
                      </dl>
                      {stringValue(booth.description) ? (
                        <p className="admin-booth-note">{stringValue(booth.description)}</p>
                      ) : null}
                    </article>
                  );
                })}
                {filteredBooths.length === 0 ? (
                  <div className="admin-empty-row">
                    <Store aria-hidden="true" />
                    <strong>등록된 부스가 없습니다.</strong>
                    <span>왼쪽 양식으로 첫 부스를 등록하세요.</span>
                  </div>
                ) : null}
              </div>
            </section>
          </section>
        ) : null}

        {activeView === "permissions" ? (
          <section className="admin-view-stack">
            <div className="admin-permission-grid">
              <section className="admin-account-list" aria-label="역할 카탈로그">
                <div className="admin-account-list__header">
                  <div>
                    <span>Roles</span>
                    <h2>역할 카탈로그</h2>
                  </div>
                  <strong>{roleCatalog.length.toLocaleString("ko-KR")}개 역할</strong>
                </div>
                <div className="admin-role-card-list">
                  {roleCatalog.map((role) => (
                    <article className="admin-role-card" key={roleIdOf(role)}>
                      <div>
                        <ShieldCheck aria-hidden="true" />
                        <strong>{roleNameOf(role)}</strong>
                      </div>
                      <p>{roleDescriptionOf(role)}</p>
                      <span>{stringValue(role.status) || "active"}</span>
                    </article>
                  ))}
                </div>
              </section>

              <Card asChild className="admin-create admin-create--static" padding="lg">
                <form aria-label="권한 할당" onSubmit={handleCreateRoleAssignment}>
                  <CardHeader>
                    <CardTitle>권한 할당</CardTitle>
                    <CardDescription>역할 할당 리소스를 생성해 감사 가능한 권한 변경 기록을 남깁니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label className="admin-field">
                      <span>대상 계정</span>
                      <select
                        aria-label="권한 대상 계정"
                        onChange={(event) => {
                          const nextAccountId = event.currentTarget.value;
                          setRoleAssignmentDraft((value) => ({
                            ...value,
                            accountId: nextAccountId,
                          }));
                        }}
                        required
                        value={roleAssignmentDraft.accountId}
                      >
                        <option value="">계정 선택</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {accountName(account)} ({account.loginId})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-field">
                      <span>역할</span>
                      <select
                        aria-label="할당할 역할"
                        onChange={(event) => {
                          const nextRoleId = event.currentTarget.value;
                          setRoleAssignmentDraft((value) => ({ ...value, roleId: nextRoleId }));
                        }}
                        required
                        value={roleAssignmentDraft.roleId}
                      >
                        <option value="">역할 선택</option>
                        {roleCatalog.map((role) => (
                          <option key={roleIdOf(role)} value={roleIdOf(role)}>
                            {roleNameOf(role)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-field">
                      <span>범위</span>
                      <select
                        aria-label="권한 범위"
                        onChange={(event) => {
                          const nextScope = event.currentTarget.value;
                          setRoleAssignmentDraft((value) => ({ ...value, scope: nextScope }));
                        }}
                        value={roleAssignmentDraft.scope}
                      >
                        <option value="global">전체</option>
                        <option value="booth">부스 단위</option>
                      </select>
                    </label>
                    {roleAssignmentDraft.scope === "booth" ? (
                      <label className="admin-field">
                        <span>부스</span>
                        <select
                          aria-label="권한 범위 부스"
                          onChange={(event) => {
                            const nextBoothId = event.currentTarget.value;
                            setRoleAssignmentDraft((value) => ({ ...value, boothId: nextBoothId }));
                          }}
                          required
                          value={roleAssignmentDraft.boothId}
                        >
                          <option value="">부스 선택</option>
                          {booths.map((booth) => (
                            <option key={boothIdOf(booth)} value={boothIdOf(booth)}>
                              {boothNameOf(booth)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <Button className="admin-submit" disabled={isAssigningRole} type="submit">
                      <ShieldCheck aria-hidden="true" />
                      {isAssigningRole ? "저장 중" : "권한 할당"}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </div>

            <section className="admin-account-list" aria-label="부스 계정 연결">
              <div className="admin-account-list__header">
                <div>
                  <span>Scope mapping</span>
                  <h2>부스 계정 연결</h2>
                </div>
                <strong>{counts.linkedBoothAccounts.toLocaleString("ko-KR")}개 연결</strong>
              </div>
              <form className="admin-inline-form" onSubmit={handleAssignBoothScope}>
                <select
                  aria-label="매핑할 부스 계정"
                  onChange={(event) => {
                    const nextAccountId = event.currentTarget.value;
                    setScopeDraft((value) => ({ ...value, accountId: nextAccountId }));
                  }}
                  required
                  value={scopeDraft.accountId}
                >
                  <option value="">부스 계정 선택</option>
                  {boothAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {accountName(account)} ({account.loginId})
                    </option>
                  ))}
                </select>
                <select
                  aria-label="연결할 부스"
                  onChange={(event) => {
                    const nextBoothId = event.currentTarget.value;
                    setScopeDraft((value) => ({ ...value, boothId: nextBoothId }));
                  }}
                  required
                  value={scopeDraft.boothId}
                >
                  <option value="">부스 선택</option>
                  {booths.map((booth) => (
                    <option key={boothIdOf(booth)} value={boothIdOf(booth)}>
                      {boothNameOf(booth)}
                    </option>
                  ))}
                </select>
                <button disabled={isSavingScope} type="submit">
                  연결 저장
                </button>
              </form>

              <div className="admin-linkage-list">
                {boothAccounts.map((account) => {
                  const linkedBooth = booths.find((booth) => boothIdOf(booth) === account.boothId);
                  const isBusy = rowActionId === account.id;

                  return (
                    <article className="admin-linkage-item" key={account.id}>
                      <div>
                        <strong>{accountName(account)}</strong>
                        <span>{account.loginId}</span>
                      </div>
                      <div>
                        <small>연결 부스</small>
                        <strong>{linkedBooth ? boothNameOf(linkedBooth) : account.boothId || "미연결"}</strong>
                      </div>
                      <button
                        disabled={isBusy || !account.boothId}
                        onClick={() => {
                          void handleClearBoothScope(account);
                        }}
                        type="button"
                      >
                        연결 해제
                      </button>
                    </article>
                  );
                })}
                {boothAccounts.length === 0 ? (
                  <div className="admin-empty-row">
                    <Users aria-hidden="true" />
                    <strong>부스 계정이 없습니다.</strong>
                    <span>계정 탭에서 부스 계정을 먼저 발급하세요.</span>
                  </div>
                ) : null}
              </div>
            </section>
          </section>
        ) : null}

        {activeView === "security" ? (
          <section className="admin-view-stack">
            <div className="admin-security-grid">
              <section className="admin-account-list" aria-label="보안 점검 계정">
                <div className="admin-account-list__header">
                  <div>
                    <span>Attention</span>
                    <h2>조치 필요 계정</h2>
                  </div>
                  <strong>{securityAccounts.length.toLocaleString("ko-KR")}개</strong>
                </div>
                <div className="admin-risk-list">
                  {securityAccounts.map((account) => {
                    const isBusy = rowActionId === account.id;

                    return (
                      <article className="admin-risk-item" key={account.id}>
                        <div className="admin-account-cell admin-account-cell--identity">
                          <span data-role={account.role}>
                            <AccountRoleIcon role={account.role} />
                          </span>
                          <div>
                            <strong>{accountName(account)}</strong>
                            <small>
                              {statusLabels[account.status] ?? account.status}
                              {account.forcePasswordChange ? " / 비밀번호 변경 요구" : ""}
                            </small>
                          </div>
                        </div>
                        <div className="admin-row-actions">
                          {account.status !== "active" ? (
                            <button
                              disabled={isBusy}
                              onClick={() => {
                                void handleStatusChange(account, "active");
                              }}
                              type="button"
                            >
                              활성화
                            </button>
                          ) : null}
                          <button
                            aria-pressed={account.forcePasswordChange ? "true" : "false"}
                            disabled={isBusy}
                            onClick={() => {
                              void handleForcePasswordChange(account);
                            }}
                            type="button"
                          >
                            <KeyRound aria-hidden="true" />
                            {account.forcePasswordChange ? "변경 요구 해제" : "변경 요구"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {securityAccounts.length === 0 ? (
                    <div className="admin-empty-row">
                      <CheckCircle2 aria-hidden="true" />
                      <strong>조치 필요한 계정이 없습니다.</strong>
                      <span>잠김, 비활성, 비밀번호 변경 요구 계정이 없습니다.</span>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="admin-account-list" aria-label="비밀번호 작업">
                <div className="admin-account-list__header">
                  <div>
                    <span>Password</span>
                    <h2>비밀번호 초기화</h2>
                  </div>
                  <strong>{accounts.length.toLocaleString("ko-KR")}개 계정</strong>
                </div>
                <div className="admin-password-list">
                  {accounts.map((account) => {
                    const isBusy = rowActionId === account.id;
                    const isResetting = resetTargetId === account.id;

                    return (
                      <article className="admin-password-item" key={account.id}>
                        <div>
                          <strong>{accountName(account)}</strong>
                          <span>{account.loginId}</span>
                        </div>
                        <button
                          disabled={isBusy}
                          onClick={() => {
                            setResetTargetId(isResetting ? undefined : account.id);
                            setResetPassword("");
                          }}
                          type="button"
                        >
                          초기화
                        </button>
                        {isResetting ? (
                          <form
                            className="admin-reset-form"
                            onSubmit={(event) => {
                              void handleResetPassword(event, account);
                            }}
                          >
                            <label>
                              <span className="admin-sr-only">{account.loginId} 새 비밀번호</span>
                              <input
                                autoComplete="new-password"
                                minLength={10}
                                onChange={(event) => setResetPassword(event.currentTarget.value)}
                                placeholder="새 비밀번호 10자 이상"
                                required
                                type="password"
                                value={resetPassword}
                              />
                            </label>
                            <button disabled={isBusy} type="submit">
                              저장
                            </button>
                          </form>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>

            <section className="admin-account-list" aria-label="보안 정책">
              <div className="admin-account-list__header">
                <div>
                  <span>Policy</span>
                  <h2>현재 보안 정책</h2>
                </div>
              </div>
              <dl className="admin-policy-list">
                <div>
                  <dt>세션 유지</dt>
                  <dd>관리자 세션 만료 기준 12시간</dd>
                </div>
                <div>
                  <dt>초기 발급</dt>
                  <dd>신규 계정은 기본적으로 다음 로그인 시 비밀번호 변경 요구</dd>
                </div>
                <div>
                  <dt>접근 범위</dt>
                  <dd>관리자는 콘솔 전체, 부스 계정은 boothId 기준 셀러 API, 티처 계정은 컨슈머 teacher API 접근</dd>
                </div>
                <div>
                  <dt>토큰 저장</dt>
                  <dd>브라우저 로컬 세션에 관리자 액세스 토큰 보관, 로그아웃 시 제거</dd>
                </div>
              </dl>
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}
