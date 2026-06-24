import type { CSSProperties } from "react";

import type { Shortcut } from "../../entities/customer-home";

type ShortcutGridProps = {
  shortcuts: readonly Shortcut[];
};

export function ShortcutGrid({ shortcuts }: ShortcutGridProps) {
  return (
    <div aria-label="단축 버튼" className="customer-shortcuts">
      {shortcuts.map((shortcut) => {
        const Icon = shortcut.icon;
        const iconStyle = {
          "--customer-shortcut-tone": shortcut.tone,
        } as CSSProperties;

        return (
          <a
            className="customer-shortcut"
            href="/"
            key={shortcut.label}
            onClick={(event) => event.preventDefault()}
          >
            <span
              className="customer-shortcut__icon"
              data-soft={shortcut.soft === true ? "true" : undefined}
              style={iconStyle}
            >
              <Icon aria-hidden="true" />
            </span>
            <span className="customer-shortcut__text">{shortcut.label}</span>
          </a>
        );
      })}
    </div>
  );
}
