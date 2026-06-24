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
};

const RankingPodiumCanvas = lazy(() =>
  import("./RankingPodiumCanvas").then((module) => ({
    default: module.RankingPodiumCanvas,
  })),
);

const shouldRenderRankingPodiumCanvas = import.meta.env.MODE !== "test";

export function RankingCard({ direction, rankings, title }: RankingCardProps) {
  return (
    <Surface asChild className="customer-ranking" padding="none">
      <section>
        <div className="customer-ranking__header">
          <h2 className="customer-ranking__title">{title}</h2>
        </div>
        <div className="customer-ranking__podium">
          {shouldRenderRankingPodiumCanvas ? (
            <Suspense
              fallback={<div aria-hidden="true" className="customer-ranking__canvas-fallback" />}
            >
              <RankingPodiumCanvas direction={direction} />
            </Suspense>
          ) : (
            <div aria-hidden="true" className="customer-ranking__canvas-fallback" />
          )}
          <div className="customer-ranking__overlay">
            {rankings.map((item) => {
              const avatarStyle = {
                "--customer-ranking-tone": item.tone,
              } as CSSProperties;

              return (
                <div className="customer-ranking__slot" data-rank={item.rank} key={item.name}>
                  {item.rank === 1 ? (
                    <span className="customer-ranking__crown">
                      <TrophyIcon aria-hidden="true" />
                    </span>
                  ) : null}
                  <span className="customer-ranking__avatar" style={avatarStyle}>
                    {item.name.slice(0, 1)}
                  </span>
                  <span className="customer-ranking__name">{item.name}</span>
                  <strong className="customer-ranking__score">{formatPoint(item.points)}P</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Surface>
  );
}
