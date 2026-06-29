import { lazy, Suspense } from "react";
import type { CSSProperties } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { Surface } from "@daema/ui/surface";

import type { RankingEntry } from "../../entities/customer-home";
import { formatPoint } from "../../shared/lib/formatPoint";

type RankingCardProps = {
  direction: "left" | "right";
  rankings: readonly RankingEntry[];
  title: string;
  unavailable?: boolean;
};

type RankingSlotProps = {
  item: RankingEntry;
};

const RankingPodiumCanvas = lazy(() =>
  import("./RankingPodiumCanvas").then((module) => ({
    default: module.RankingPodiumCanvas,
  })),
);

const shouldRenderRankingPodiumCanvas = import.meta.env.MODE !== "test";
const podiumDisplayOrder = [2, 1, 3] as const;

function getPodiumRankings(rankings: readonly RankingEntry[]) {
  return podiumDisplayOrder
    .map((rank) => rankings.find((item) => item.rank === rank))
    .filter((item): item is RankingEntry => item !== undefined);
}

export function RankingCardHeader({ title }: Pick<RankingCardProps, "title">) {
  return (
    <div className="customer-ranking__header">
      <h2 className="customer-ranking__title">{title}</h2>
    </div>
  );
}

export function RankingAvatar({ item }: RankingSlotProps) {
  const avatarStyle = {
    "--customer-ranking-tone": item.tone,
  } as CSSProperties;

  return (
    <span className="customer-ranking__avatar" style={avatarStyle}>
      {item.avatarUrl ? <img alt="" aria-hidden="true" src={item.avatarUrl} /> : item.name.slice(0, 1)}
    </span>
  );
}

export function RankingSlot({ item }: RankingSlotProps) {
  return (
    <div className="customer-ranking__slot" data-rank={item.rank}>
      {item.rank === 1 ? (
        <span className="customer-ranking__crown">
          <TrophyIcon aria-hidden="true" />
        </span>
      ) : null}
      <RankingAvatar item={item} />
      <span className="customer-ranking__name">{item.name}</span>
      <strong className="customer-ranking__score">{formatPoint(item.points)}P</strong>
    </div>
  );
}

export function RankingOverlay({ rankings }: { rankings: readonly RankingEntry[] }) {
  return (
    <div className="customer-ranking__overlay">
      {rankings.map((item) => (
        <RankingSlot item={item} key={item.name} />
      ))}
    </div>
  );
}

export function RankingCanvasLayer({ direction }: Pick<RankingCardProps, "direction">) {
  if (!shouldRenderRankingPodiumCanvas) {
    return <div aria-hidden="true" className="customer-ranking__canvas-fallback" />;
  }

  return (
    <Suspense fallback={<div aria-hidden="true" className="customer-ranking__canvas-fallback" />}>
      <RankingPodiumCanvas direction={direction} />
    </Suspense>
  );
}

export function RankingUnavailableNotice() {
  return (
    <div className="customer-ranking__unavailable" aria-live="polite">
      <strong>아직은 지원되지 않는 기능입니다.</strong>
    </div>
  );
}

export function RankingCard({ direction, rankings, title, unavailable = false }: RankingCardProps) {
  const orderedRankings = getPodiumRankings(rankings);

  return (
    <Surface asChild className="customer-ranking" padding="none">
      <section data-unavailable={unavailable ? "true" : undefined}>
        <RankingCardHeader title={title} />
        <div className="customer-ranking__podium">
          <RankingCanvasLayer direction={direction} />
          <RankingOverlay rankings={orderedRankings} />
        </div>
        {unavailable ? <RankingUnavailableNotice /> : null}
      </section>
    </Surface>
  );
}
