import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { Surface } from "@daema/ui/surface";

import type { PromoBanner as PromoBannerContent } from "../../entities/customer-home";

type PromoBannersProps = {
  banners: readonly PromoBannerContent[];
};

type SinglePromoBannerProps = {
  banner: PromoBannerContent;
};

export function PromoBanners({ banners }: PromoBannersProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const activeBannerRef = useRef(0);
  const promoScrollerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    activeBannerRef.current = activeBanner;
  }, [activeBanner]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const scroller = promoScrollerRef.current;

      if (!scroller) {
        return;
      }

      const nextIndex = (activeBannerRef.current + 1) % banners.length;
      scroller.scrollTo({
        behavior: "smooth",
        left: scroller.clientWidth * nextIndex,
      });
      setActiveBanner(nextIndex);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [banners.length]);

  return (
    <section
      aria-label="혜택 배너"
      className="customer-promo-scroller"
      onScroll={(event) => {
        const target = event.currentTarget;
        const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
        setActiveBanner(Math.min(Math.max(nextIndex, 0), banners.length - 1));
      }}
      ref={promoScrollerRef}
    >
      {banners.map((banner) => (
        <PromoBannerView banner={banner} key={banner.title} />
      ))}
    </section>
  );
}

export function SinglePromoBanner({ banner }: SinglePromoBannerProps) {
  return (
    <Surface
      asChild
      className="customer-promo customer-promo--standalone"
      padding="none"
      tone="muted"
    >
      <a href="/" onClick={(event) => event.preventDefault()}>
        <PromoBannerContent banner={banner} />
      </a>
    </Surface>
  );
}

function PromoBannerView({ banner }: SinglePromoBannerProps) {
  return (
    <Surface asChild className="customer-promo" padding="none" tone="muted">
      <a href="/" onClick={(event) => event.preventDefault()}>
        <PromoBannerContent banner={banner} />
      </a>
    </Surface>
  );
}

function PromoBannerContent({ banner }: SinglePromoBannerProps) {
  return (
    <>
      <span className="customer-promo__copy">
        <span>{banner.kicker}</span>
        <strong>
          {banner.title}
          <ChevronRightIcon aria-hidden="true" className="customer-promo__chevron" />
        </strong>
      </span>
      <img alt="" aria-hidden="true" className="customer-promo__icon" src={banner.iconSrc} />
    </>
  );
}
