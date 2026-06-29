import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { Shortcut } from "../../entities/customer-home";
import {
  navigateCustomerPathFromClick,
  shouldHandleCustomerNavigationClick,
} from "../../shared/lib/customerNavigation";

type ShortcutGridProps = {
  shortcuts: readonly Shortcut[];
};

type ShortcutItemProps = {
  onUnsupportedClick: () => void;
  shortcut: Shortcut;
};

type ShortcutIconProps = {
  shortcut: Shortcut;
};

type UnsupportedFloatingNoticeProps = {
  noticeKey: number;
};

export function ShortcutIcon({ shortcut }: ShortcutIconProps) {
  const Icon = shortcut.icon;
  const iconStyle = {
    "--customer-shortcut-tone": shortcut.tone,
  } as CSSProperties;

  return (
    <span
      className="customer-shortcut__icon"
      data-soft={shortcut.soft === true ? "true" : undefined}
      style={iconStyle}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}

export function ShortcutLabel({ label }: Pick<Shortcut, "label">) {
  return <span className="customer-shortcut__text">{label}</span>;
}

export function ShortcutItem({ onUnsupportedClick, shortcut }: ShortcutItemProps) {
  return (
    <a
      className="customer-shortcut"
      href={shortcut.path}
      onClick={(event) => {
        if (!shouldHandleCustomerNavigationClick(event)) {
          return;
        }

        if (shortcut.unsupported) {
          event.preventDefault();
          onUnsupportedClick();
          return;
        }

        navigateCustomerPathFromClick(event, shortcut.path);
      }}
    >
      <ShortcutIcon shortcut={shortcut} />
      <ShortcutLabel label={shortcut.label} />
    </a>
  );
}

export function UnsupportedFloatingNotice({ noticeKey }: UnsupportedFloatingNoticeProps) {
  return (
    <div
      aria-live="polite"
      className="customer-unsupported-floating-notice"
      key={noticeKey}
      role="status"
    >
      아직은 지원되지 않는 기능입니다.
    </div>
  );
}

export function ShortcutGrid({ shortcuts }: ShortcutGridProps) {
  const [noticeKey, setNoticeKey] = useState(0);
  const [isNoticeVisible, setIsNoticeVisible] = useState(false);
  const noticeTimerRef = useRef<number | undefined>(undefined);

  const showUnsupportedNotice = () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setNoticeKey((key) => key + 1);
    setIsNoticeVisible(true);

    noticeTimerRef.current = window.setTimeout(() => {
      setIsNoticeVisible(false);
    }, 1800);
  };

  useEffect(
    () => () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    },
    [],
  );

  return (
    <>
      <div aria-label="단축 버튼" className="customer-shortcuts">
        {shortcuts.map((shortcut) => (
          <ShortcutItem
            key={shortcut.label}
            onUnsupportedClick={showUnsupportedNotice}
            shortcut={shortcut}
          />
        ))}
      </div>
      {isNoticeVisible ? <UnsupportedFloatingNotice noticeKey={noticeKey} /> : null}
    </>
  );
}
