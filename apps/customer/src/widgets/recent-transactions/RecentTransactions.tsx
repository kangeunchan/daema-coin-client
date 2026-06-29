import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { Surface } from "@daema/ui/surface";

import type { RecentTransaction } from "../../entities/customer-home";
import { navigateCustomerPathFromClick } from "../../shared/lib/customerNavigation";

type RecentTransactionsProps = {
  href?: string;
  title?: string;
  transactions: readonly RecentTransaction[];
};

type RecentTransactionsContentProps = {
  title: string;
  transactions: readonly RecentTransaction[];
};

export function RecentTransactionsHeader({ title }: Pick<RecentTransactionsContentProps, "title">) {
  return (
    <div className="customer-recent__header">
      <h2 className="customer-recent__title">{title}</h2>
      <ChevronRightIcon aria-hidden="true" className="customer-recent__more" />
    </div>
  );
}

export function RecentTransactionItem({ transaction }: { transaction: RecentTransaction }) {
  return (
    <div className="customer-recent__item">
      <div className="customer-recent__copy">
        <span className="customer-recent__meta">{transaction.meta}</span>
        <strong className="customer-recent__amount">{transaction.amount}</strong>
      </div>
      <span className="customer-recent__time">{transaction.time}</span>
    </div>
  );
}

export function RecentTransactionsEmpty() {
  return <div className="customer-recent__empty">아직 내역이 없습니다</div>;
}

export function RecentTransactionsList({ transactions }: Pick<RecentTransactionsContentProps, "transactions">) {
  return (
    <div className="customer-recent__list">
      {transactions.length > 0 ? (
        transactions.slice(0, 6).map((transaction) => (
          <RecentTransactionItem
            key={`${transaction.meta}-${transaction.time}`}
            transaction={transaction}
          />
        ))
      ) : (
        <RecentTransactionsEmpty />
      )}
    </div>
  );
}

export function RecentTransactionsContent({ title, transactions }: RecentTransactionsContentProps) {
  return (
    <>
      <RecentTransactionsHeader title={title} />
      <RecentTransactionsList transactions={transactions} />
    </>
  );
}

export function RecentTransactions({
  href,
  title = "내역",
  transactions,
}: RecentTransactionsProps) {
  const content = <RecentTransactionsContent title={title} transactions={transactions} />;

  if (href) {
    return (
      <Surface asChild className="customer-recent customer-recent--link" padding="none">
        <a
          aria-label={`${title} 상세 보기`}
          href={href}
          onClick={(event) => {
            navigateCustomerPathFromClick(event, href);
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
