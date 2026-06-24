export function NoticeBar() {
  return (
    <a aria-label="공지사항으로 이동" className="customer-notice" href="/notices">
      <span className="customer-notice__label">공지</span>
      <span className="customer-notice__text">대마페이 포인트 적립 혜택이 업데이트됐어요</span>
    </a>
  );
}
