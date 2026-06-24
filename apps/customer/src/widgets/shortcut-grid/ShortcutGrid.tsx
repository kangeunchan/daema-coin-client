import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { Shortcut } from "../../entities/customer-home";
import { pushCustomerPath } from "../../shared/lib/customerNavigation";

type ShortcutGridProps = {
  shortcuts: readonly Shortcut[];
};

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
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          const iconStyle = {
            "--customer-shortcut-tone": shortcut.tone,
          } as CSSProperties;

          return (
            <a
              className="customer-shortcut"
              href={shortcut.path}
              key={shortcut.label}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                  return;
                }

                event.preventDefault();

                if (shortcut.unsupported) {
                  showUnsupportedNotice();
                  return;
                }

                pushCustomerPath(shortcut.path);
              }}
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
      {isNoticeVisible ? (
        <div
          aria-live="polite"
          className="customer-unsupported-floating-notice"
          key={noticeKey}
          role="status"
        >
          아직은 지원되지 않는 기능입니다.
        </div>
      ) : null}
    </>
  );
}
