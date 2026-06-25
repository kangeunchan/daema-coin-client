import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@daema/ui/badge";
import { Button } from "@daema/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@daema/ui/card";
import { Text } from "@daema/ui/text";

import {
  AdminApiError,
  createInternalAccount,
  fetchAdminMe,
  fetchInternalAccounts,
  isAdminApiEnabled,
  loginAdmin,
  logoutAdmin,
} from "./api";
import type { AdminUser, InternalAccount } from "./api";

const statusLabels: Record<string, string> = {
  active: "활성",
  disabled: "비활성",
  locked: "잠김",
};

const roleLabels: Record<string, string> = {
  admin: "관리자",
  booth: "부스",
};

function errorMessage(error: unknown) {
  if (error instanceof AdminApiError) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
}

export function App() {
  const [session, setSession] = useState<AdminUser | undefined>();
  const [accounts, setAccounts] = useState<readonly InternalAccount[]>([]);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [newAccount, setNewAccount] = useState({
    boothId: "",
    displayName: "",
    loginId: "",
    password: "",
    role: "booth" as "admin" | "booth",
  });
  const [isChecking, setIsChecking] = useState(() => isAdminApiEnabled());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadAccounts = async () => {
    const nextAccounts = await fetchInternalAccounts();
    setAccounts(nextAccounts);
  };

  useEffect(() => {
    if (!isAdminApiEnabled()) {
      return;
    }

    let isActive = true;

    void fetchAdminMe()
      .then((nextSession) => {
        if (!isActive || nextSession.role !== "admin") {
          return;
        }

        setSession(nextSession);
        return loadAccounts();
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) {
          setIsChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    void loginAdmin(loginId.trim(), password)
      .then(async (nextSession) => {
        setSession(nextSession);
        setPassword("");
        await loadAccounts();
      })
      .catch((nextError) => {
        setError(errorMessage(nextError));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleCreateAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

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

    void createInternalAccount(payload)
      .then(async () => {
        setNewAccount({
          boothId: "",
          displayName: "",
          loginId: "",
          password: "",
          role: "booth",
        });
        await loadAccounts();
      })
      .catch((nextError) => {
        setError(errorMessage(nextError));
      })
      .finally(() => {
        setIsSubmitting(false);
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
              {error ? <p className="admin-error">{error}</p> : null}
              <Button className="admin-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? "확인 중" : "로그인"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="app app--dashboard">
      <section className="admin-dashboard" aria-label="관리자 워크스페이스">
        <header className="admin-dashboard__header">
          <div>
            <Badge intent="brand">Admin</Badge>
            <h1>계정 관리</h1>
            <p>{session.user?.login ?? session.user?.name ?? "관리자"} 계정으로 로그인됨</p>
          </div>
          <Button
            intent="secondary"
            onClick={() => {
              void logoutAdmin().finally(() => {
                setSession(undefined);
                setAccounts([]);
              });
            }}
            type="button"
          >
            로그아웃
          </Button>
        </header>

        {error ? <p className="admin-error admin-error--wide">{error}</p> : null}

        <section className="admin-grid">
          <Card asChild className="admin-create" padding="lg">
            <form aria-label="내부 계정 생성" onSubmit={handleCreateAccount}>
              <CardHeader>
                <CardTitle>계정 발급</CardTitle>
                <CardDescription>관리자 또는 부스 운영 계정을 생성합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="admin-field">
                  <span>역할</span>
                  <select
                    onChange={(event) => {
                      setNewAccount((value) => ({
                        ...value,
                        role: event.currentTarget.value as "admin" | "booth",
                      }));
                    }}
                    value={newAccount.role}
                  >
                    <option value="booth">부스 계정</option>
                    <option value="admin">관리자</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>계정 ID</span>
                  <input
                    autoComplete="off"
                    onChange={(event) => {
                      setNewAccount((value) => ({ ...value, loginId: event.currentTarget.value }));
                    }}
                    required
                    value={newAccount.loginId}
                  />
                </label>
                <label className="admin-field">
                  <span>표시 이름</span>
                  <input
                    onChange={(event) => {
                      setNewAccount((value) => ({
                        ...value,
                        displayName: event.currentTarget.value,
                      }));
                    }}
                    required
                    value={newAccount.displayName}
                  />
                </label>
                {newAccount.role === "booth" ? (
                  <label className="admin-field">
                    <span>부스 ID</span>
                    <input
                      onChange={(event) => {
                        setNewAccount((value) => ({
                          ...value,
                          boothId: event.currentTarget.value,
                        }));
                      }}
                      required
                      value={newAccount.boothId}
                    />
                  </label>
                ) : null}
                <label className="admin-field">
                  <span>초기 비밀번호</span>
                  <input
                    minLength={10}
                    onChange={(event) => {
                      setNewAccount((value) => ({
                        ...value,
                        password: event.currentTarget.value,
                      }));
                    }}
                    required
                    type="password"
                    value={newAccount.password}
                  />
                </label>
                <Button className="admin-submit" disabled={isSubmitting} type="submit">
                  계정 생성
                </Button>
              </CardContent>
            </form>
          </Card>

          <section className="admin-account-list" aria-label="내부 계정 목록">
            <div className="admin-account-list__header">
              <h2>발급 계정</h2>
              <span>{accounts.length.toLocaleString("ko-KR")}개</span>
            </div>
            <div className="admin-table" role="table">
              <div className="admin-table__row admin-table__row--head" role="row">
                <span>계정</span>
                <span>역할</span>
                <span>상태</span>
                <span>부스</span>
              </div>
              {accounts.map((account) => (
                <div className="admin-table__row" key={account.id} role="row">
                  <span>
                    <strong>{account.displayName || account.loginId}</strong>
                    <small>{account.loginId}</small>
                  </span>
                  <span>{roleLabels[account.role] ?? account.role}</span>
                  <span>{statusLabels[account.status] ?? account.status}</span>
                  <span>{account.boothId || "-"}</span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
