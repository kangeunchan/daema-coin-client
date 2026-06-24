import type { ReactNode } from "react";

import { LiquidGlassFilter } from "./LiquidGlassFilter";

type CustomerAppShellProps = {
  children: ReactNode;
};

export function CustomerAppShell({ children }: CustomerAppShellProps) {
  return (
    <>
      <LiquidGlassFilter />
      <main className="customer-page">
        <section aria-label="Mobile web app width range" className="customer-app-frame">
          {children}
        </section>
      </main>
    </>
  );
}
