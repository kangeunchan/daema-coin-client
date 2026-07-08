import { useState } from "react";
import { ArrowRightIcon, KeyIcon } from "@heroicons/react/24/solid";

import { CustomerApiError } from "../../shared/api/client";

type TeacherLoginPageProps = {
  onLogin: (credentials: { loginId: string; password: string }) => Promise<void>;
};

export function TeacherLoginPage({ onLogin }: TeacherLoginPageProps) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canSubmit = loginId.trim().length > 0 && password.length >= 10;

  return (
    <main className="teacher-login-page" aria-labelledby="teacher-login-title">
      <section className="teacher-login-panel">
        <div className="teacher-login-brand">
          <span>daema.</span>
          <strong>Teacher</strong>
        </div>
        <h1 id="teacher-login-title">교사용 로그인</h1>
        <p>교사용 테스트 계정으로 컨슈머 화면에 접속합니다.</p>

        <form
          className="teacher-login-form"
          onSubmit={(event) => {
            event.preventDefault();

            if (!canSubmit) {
              return;
            }

            setIsLoading(true);
            setErrorMessage(null);

            void onLogin({ loginId: loginId.trim(), password })
              .catch((error: unknown) => {
                setErrorMessage(
                  error instanceof CustomerApiError && error.status === 401
                    ? "계정 ID 또는 비밀번호가 올바르지 않습니다."
                    : "교사용 로그인을 완료하지 못했습니다.",
                );
              })
              .finally(() => {
                setIsLoading(false);
              });
          }}
        >
          <label className="teacher-login-field">
            <span>계정 ID</span>
            <input
              autoComplete="username"
              onChange={(event) => setLoginId(event.currentTarget.value)}
              placeholder="teacher"
              required
              value={loginId}
            />
          </label>

          <label className="teacher-login-field">
            <span>비밀번호</span>
            <input
              autoComplete="current-password"
              minLength={10}
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="10자 이상"
              required
              type="password"
              value={password}
            />
          </label>

          <button className="teacher-login-submit" disabled={!canSubmit || isLoading} type="submit">
            <KeyIcon aria-hidden="true" />
            <span>{isLoading ? "확인 중" : "교사용 계정으로 시작"}</span>
            <ArrowRightIcon aria-hidden="true" />
          </button>
        </form>

        {errorMessage ? <p className="teacher-login-error">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
