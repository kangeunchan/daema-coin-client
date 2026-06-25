import { useState } from "react";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { FaGithub } from "react-icons/fa6";

import { pushCustomerPath } from "../../shared/lib/customerNavigation";
import type { GithubAuthenticationResult } from "../../shared/api/auth";
import { LoginCoinCanvas } from "./ui/LoginCoinCanvas";

type CustomerLoginPageProps = {
  initialStep?: "github" | "profile";
  onGithubAuthenticated: () => Promise<GithubAuthenticationResult>;
  onLogin: (profile: { name: string; studentNo: string }) => Promise<void>;
};

export function CustomerLoginPage({
  initialStep = "github",
  onGithubAuthenticated,
  onLogin,
}: CustomerLoginPageProps) {
  const [step, setStep] = useState<"github" | "profile">(initialStep);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canContinue = studentId.trim().length >= 4 && name.trim().length >= 2;

  return (
    <main className="customer-login-page" aria-labelledby="customer-login-title" data-step={step}>
      <section className="customer-login-hero">
        <span className="customer-login-brand">daema.</span>
        <h1 className="customer-login-sr-title" id="customer-login-title">
          로그인
        </h1>
      </section>

      {step === "github" ? (
        <>
          <LoginCoinCanvas />
          <div className="customer-login-bottom-action" aria-label="GitHub 인증">
            <button
              className="customer-login-github"
              disabled={isGithubLoading}
              onClick={() => {
                setIsGithubLoading(true);
                setErrorMessage(null);

                void onGithubAuthenticated()
                  .then((result) => {
                    if (result.status === "profile_required") {
                      setStep("profile");
                    }
                  })
                  .catch(() => {
                    setErrorMessage("GitHub 인증을 완료하지 못했어요.");
                  })
                  .finally(() => {
                    setIsGithubLoading(false);
                  });
              }}
              type="button"
            >
              <FaGithub aria-hidden="true" />
              <span>{isGithubLoading ? "연결 중" : "GitHub로 로그인"}</span>
              <ArrowRightIcon aria-hidden="true" />
            </button>
            {errorMessage ? <p className="customer-login-error">{errorMessage}</p> : null}
          </div>
        </>
      ) : (
        <form
          className="customer-login-card"
          onSubmit={(event) => {
            event.preventDefault();

            if (!canContinue) {
              return;
            }

            setIsProfileLoading(true);
            setErrorMessage(null);

            void onLogin({ name: name.trim(), studentNo: studentId.trim() })
              .then(() => {
                pushCustomerPath("/");
              })
              .catch(() => {
                setErrorMessage("학생 정보를 저장하지 못했어요.");
              })
              .finally(() => {
                setIsProfileLoading(false);
              });
          }}
        >
          <div className="customer-login-field">
            <label htmlFor="customer-student-id">학번</label>
            <input
              autoComplete="username"
              id="customer-student-id"
              inputMode="numeric"
              onChange={(event) => {
                setStudentId(event.currentTarget.value.replace(/\D/g, "").slice(0, 12));
              }}
              placeholder="학번 입력"
              value={studentId}
            />
          </div>

          <div className="customer-login-field">
            <label htmlFor="customer-student-name">이름</label>
            <input
              autoComplete="name"
              id="customer-student-name"
              onChange={(event) => {
                setName(event.currentTarget.value.slice(0, 20));
              }}
              placeholder="이름 입력"
              value={name}
            />
          </div>

          <button
            className="customer-login-github customer-login-submit"
            disabled={!canContinue || isProfileLoading}
            type="submit"
          >
            <CheckCircleIcon aria-hidden="true" />
            <span>{isProfileLoading ? "저장 중" : "학생 정보 확인하기"}</span>
            <ArrowRightIcon aria-hidden="true" />
          </button>
          {errorMessage ? <p className="customer-login-error">{errorMessage}</p> : null}
        </form>
      )}
    </main>
  );
}
