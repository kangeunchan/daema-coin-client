import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@daema/ui/badge";
import { Button } from "@daema/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@daema/ui/card";
import { Text } from "@daema/ui/text";

import {
  fetchSellerBooths,
  fetchSellerDashboard,
  fetchSellerMe,
  isSellerApiEnabled,
  loginSeller,
  logoutSeller,
  SellerApiError,
} from "./api";
import type { SellerBooth, SellerDashboard, SellerMe } from "./api";

function errorMessage(error: unknown) {
  if (error instanceof SellerApiError) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
}

export function App() {
  const [session, setSession] = useState<SellerMe | undefined>();
  const [booths, setBooths] = useState<readonly SellerBooth[]>([]);
  const [dashboard, setDashboard] = useState<SellerDashboard | undefined>();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(() => isSellerApiEnabled());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadSellerData = async () => {
    const nextBooths = await fetchSellerBooths();
    setBooths(nextBooths);

    const firstBoothId = nextBooths[0]?.id;
    if (firstBoothId) {
      setDashboard(await fetchSellerDashboard(firstBoothId));
    } else {
      setDashboard(undefined);
    }
  };

  useEffect(() => {
    if (!isSellerApiEnabled()) {
      return;
    }

    let isActive = true;

    void fetchSellerMe()
      .then((nextSession) => {
        if (!isActive) {
          return;
        }

        setSession(nextSession);
        return loadSellerData();
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

    void loginSeller(loginId.trim(), password)
      .then(async (result) => {
        setSession(result.user);
        setPassword("");
        await loadSellerData();
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
        <section className="seller-panel" aria-label="부스 앱 확인 중">
          <Text color="muted">세션 확인 중</Text>
        </section>
      </main>
    );
  }

  if (!isSellerApiEnabled()) {
    return (
      <main className="app">
        <section className="seller-panel" aria-label="부스 API 설정 필요">
          <Badge intent="success">Booth</Badge>
          <h1>부스 API 설정 필요</h1>
          <p>VITE_SELLER_API_BASE_URL을 /api로 끝나는 백엔드 주소로 설정하세요.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app">
        <Card asChild className="seller-login" padding="lg">
          <form aria-label="부스 로그인" onSubmit={handleLogin}>
            <CardHeader>
              <Badge intent="success">Booth</Badge>
              <CardTitle>부스 계정 로그인</CardTitle>
              <CardDescription>관리자가 발급한 부스 계정으로 접속합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="seller-field">
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
              <label className="seller-field">
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
              {error ? <p className="seller-error">{error}</p> : null}
              <Button className="seller-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? "확인 중" : "로그인"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    );
  }

  const activeBooth = booths[0];

  return (
    <main className="app app--dashboard">
      <section className="seller-dashboard" aria-label="부스 워크스페이스">
        <header className="seller-dashboard__header">
          <div>
            <Badge intent="success">Booth</Badge>
            <h1>{activeBooth?.name ?? session.displayName ?? "부스 운영"}</h1>
            <p>{session.loginId ?? session.displayName} 계정으로 로그인됨</p>
          </div>
          <Button
            intent="secondary"
            onClick={() => {
              void logoutSeller().finally(() => {
                setSession(undefined);
                setBooths([]);
                setDashboard(undefined);
              });
            }}
            type="button"
          >
            로그아웃
          </Button>
        </header>

        <section className="seller-metrics" aria-label="부스 지표">
          <div>
            <span>상품</span>
            <strong>{(dashboard?.productCount ?? 0).toLocaleString("ko-KR")}</strong>
          </div>
          <div>
            <span>주문</span>
            <strong>{(dashboard?.orderCount ?? 0).toLocaleString("ko-KR")}</strong>
          </div>
          <div>
            <span>결제</span>
            <strong>{(dashboard?.paymentCount ?? 0).toLocaleString("ko-KR")}</strong>
          </div>
          <div>
            <span>매출</span>
            <strong>{dashboard?.revenue?.formatted ?? "0 DMC"}</strong>
          </div>
        </section>

        <section className="seller-booths" aria-label="담당 부스">
          <div className="seller-booths__header">
            <h2>담당 부스</h2>
            <span>{booths.length.toLocaleString("ko-KR")}개</span>
          </div>
          {booths.length > 0 ? (
            <div className="seller-booth-list">
              {booths.map((booth) => (
                <article className="seller-booth" key={String(booth.id)}>
                  <strong>{booth.name ?? booth.id}</strong>
                  <span>{booth.locationLabel ?? "위치 미지정"}</span>
                  <small>{booth.status ?? "active"}</small>
                </article>
              ))}
            </div>
          ) : (
            <p className="seller-empty">아직 연결된 부스가 없습니다.</p>
          )}
        </section>
      </section>
    </main>
  );
}
