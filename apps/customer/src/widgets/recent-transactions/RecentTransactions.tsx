import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { Surface } from "@daema/ui/surface";

import type { RecentTransaction } from "../../entities/customer-home";
import { pushCustomerPath } from "../../shared/lib/customerNavigation";

type RecentTransactionsProps = {
  href?: string;
  title?: string;
  transactions: readonly RecentTransaction[];
};

export function RecentTransactions({
  href,
  title = "내역",
  transactions,
}: RecentTransactionsProps) {
  const content = (
    <>
      <div className="customer-recent__header">
        <h2 className="customer-recent__title">{title}</h2>
        <ChevronRightIcon aria-hidden="true" className="customer-recent__more" />
      </div>
      <div className="customer-recent__list">
        {transactions.length > 0 ? (
          transactions.slice(0, 6).map((transaction) => (
            <div className="customer-recent__item" key={`${transaction.meta}-${transaction.time}`}>
              <div className="customer-recent__copy">
                <span className="customer-recent__meta">{transaction.meta}</span>
                <strong className="customer-recent__amount">{transaction.amount}</strong>
              </div>
              <span className="customer-recent__time">{transaction.time}</span>
            </div>
          ))
        ) : (
          <div className="customer-recent__empty">아직 내역이 없습니다</div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Surface asChild className="customer-recent customer-recent--link" padding="none">
        <a
          aria-label={`${title} 상세 보기`}
          href={href}
          onClick={(event) => {
            event.preventDefault();
            pushCustomerPath(href);
          }}
        >
          {content}
        </a>
      </Surface>
    );
  }

  return (
    <Surface asChild className="customer-recent" padding="none">
      <section>{content}</section>
    </Surface>
  );
}
