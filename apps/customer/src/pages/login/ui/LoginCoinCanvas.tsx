import { lazy, Suspense } from "react";

const LoginCoinScene = lazy(() =>
  import("./LoginCoinScene").then((module) => ({ default: module.LoginCoinScene })),
);

export function LoginCoinCanvas() {
  if (import.meta.env.MODE === "test") {
    return <div className="customer-login-coin-fallback" aria-hidden="true" />;
  }

  return (
    <div className="customer-login-coin" aria-hidden="true">
      <Suspense fallback={null}>
        <LoginCoinScene />
      </Suspense>
    </div>
  );
}
