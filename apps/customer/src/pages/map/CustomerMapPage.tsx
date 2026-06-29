import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChatBubbleOvalLeftEllipsisIcon, EyeIcon, HeartIcon } from "@heroicons/react/24/outline";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";
import { IconButton } from "@daema/ui/icon-button";
import { Surface } from "@daema/ui/surface";

import { pushCustomerPath } from "../../shared/lib/customerNavigation";
import { useCustomerPathname } from "../../shared/lib/useCustomerPathname";
import { AppHeader } from "../../widgets/app-header";
import {
  boothCategories,
  boothHeroSlides,
  formatDmc,
  getProductIdFromPathname,
  recommendedProducts,
} from "./model/boothContent";
import type { BoothCategoryId, BoothProduct } from "./model/boothContent";

type BoothRecommendationsProps = {
  categoryId: BoothCategoryId;
  onProductSelect: (product: BoothProduct) => void;
  panelId: string;
  title: string;
};

function isImageVisuallyDark(image: HTMLImageElement) {
  const sampleSize = 24;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return false;
  }

  canvas.width = sampleSize;
  canvas.height = sampleSize;
  context.drawImage(image, 0, 0, sampleSize, sampleSize);

  const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
  let luminanceTotal = 0;
  let opaquePixelCount = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;

    if (alpha < 32) {
      continue;
    }

    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    luminanceTotal += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    opaquePixelCount += 1;
  }

  if (opaquePixelCount === 0) {
    return false;
  }

  return luminanceTotal / opaquePixelCount < 92;
}

export function CustomerMapPage() {
  const pathname = useCustomerPathname();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState<BoothCategoryId>("all");
  const selectedProductId = getProductIdFromPathname(pathname);
  const activeCategory = boothCategories.find((category) => category.id === activeCategoryId);
  const selectedProduct = recommendedProducts.find((product) => product.id === selectedProductId);
  const tabPanelId = useId();
  const categoryTabRefs = useRef(new Map<BoothCategoryId, HTMLButtonElement>());

  useEffect(() => {
    categoryTabRefs.current.get(activeCategoryId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategoryId]);

  const openProductDetail = (product: BoothProduct) => {
    pushCustomerPath(`/booth/${product.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeProductDetail = () => {
    pushCustomerPath("/booth");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedProduct) {
    return <BoothProductDetail onBack={closeProductDetail} product={selectedProduct} />;
  }

  return (
    <div className="customer-booth-page">
      <AppHeader action="cart" stickyActions />
      <Surface asChild className="customer-booth-category-surface" padding="none">
        <nav aria-label="부스 카테고리">
          <div className="customer-booth-categories" role="tablist">
            {boothCategories.map((category) => (
              <button
                aria-controls={tabPanelId}
                aria-selected={activeCategoryId === category.id}
                className="customer-booth-category"
                data-active={activeCategoryId === category.id ? "true" : undefined}
                id={`booth-category-${category.id}`}
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                ref={(node) => {
                  if (node) {
                    categoryTabRefs.current.set(category.id, node);
                    return;
                  }

                  categoryTabRefs.current.delete(category.id);
                }}
                role="tab"
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>
        </nav>
      </Surface>
      <section
        aria-label="부스 추천 상품"
        className="customer-booth-hero-scroller"
        onScroll={(event) => {
          const target = event.currentTarget;
          const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
          setActiveSlide(Math.min(Math.max(nextIndex, 0), boothHeroSlides.length - 1));
        }}
      >
        {boothHeroSlides.map((slide, index) => (
          <Surface
            asChild
            className="customer-booth-hero-card"
            data-tone={"tone" in slide ? slide.tone : undefined}
            key={slide.title}
            padding="none"
            style={
              {
                "--customer-booth-hero-background": slide.background,
                "--customer-booth-hero-foreground":
                  "muted" in slide ? "#ffffff" : "var(--daema-color-foreground-default)",
                "--customer-booth-hero-muted":
                  "muted" in slide ? slide.muted : "rgb(15 23 42 / 0.66)",
              } as CSSProperties
            }
          >
            <article aria-current={activeSlide === index ? "true" : undefined}>
              <span className="customer-booth-hero-card__copy">
                <span className="customer-booth-hero-card__badge">{slide.badge}</span>
                <strong>{slide.title}</strong>
                <b>{slide.value}</b>
                <span className="customer-booth-hero-card__subtitle">{slide.subtitle}</span>
                <span className="customer-booth-hero-card__note">{slide.note}</span>
              </span>
              <img
                alt=""
                aria-hidden="true"
                className="customer-booth-hero-card__image"
                src={slide.imageSrc}
              />
              <span className="customer-booth-hero-card__count">
                {index + 1} / {boothHeroSlides.length}
              </span>
            </article>
          </Surface>
        ))}
      </section>
      <BoothRecommendations
        categoryId={activeCategoryId}
        key={activeCategoryId}
        onProductSelect={openProductDetail}
        panelId={tabPanelId}
        title={activeCategory?.title ?? "강은찬님을 위한 추천 상품"}
      />
    </div>
  );
}

function BoothRecommendations({
  categoryId,
  onProductSelect,
  panelId,
  title,
}: BoothRecommendationsProps) {
  const [darkImageBySrc, setDarkImageBySrc] = useState<Record<string, boolean>>({});
  const filteredProducts =
    categoryId === "all"
      ? recommendedProducts
      : recommendedProducts.filter((product) =>
          (product.categories as readonly BoothCategoryId[]).includes(categoryId),
        );
  const displayProducts = Array.from({ length: 10 }, (_, repeatIndex) =>
    filteredProducts.map((product) => ({
      ...product,
      instanceId: `${product.id}-${repeatIndex}`,
    })),
  ).flat();
  const leftProducts = displayProducts.filter((_, index) => index % 2 === 0);
  const rightProducts = displayProducts.filter((_, index) => index % 2 === 1);

  const renderProduct = (product: (typeof displayProducts)[number]) => (
    <Surface
      asChild
      className="customer-booth-product-card"
      data-image-tone={darkImageBySrc[product.imageSrc] ? "dark" : "light"}
      key={product.instanceId}
      padding="none"
      style={{ "--customer-booth-product-image-bg": product.imageBackground } as CSSProperties}
    >
      <button
        aria-label={`${product.title} 상세 보기`}
        onClick={() => onProductSelect(product)}
        type="button"
      >
        <div className="customer-booth-product-card__media">
          <img
            alt=""
            aria-hidden="true"
            onLoad={(event) => {
              const isDark = isImageVisuallyDark(event.currentTarget);
              setDarkImageBySrc((current) =>
                current[product.imageSrc] === isDark
                  ? current
                  : { ...current, [product.imageSrc]: isDark },
              );
            }}
            src={product.imageSrc}
          />
        </div>
        <div className="customer-booth-product-card__body">
          <strong>{product.title}</strong>
          <span className="customer-booth-product-card__meta">
            <span>
              <EyeIcon aria-hidden="true" />
              {product.meta}
            </span>
            {"rating" in product ? <span>★ {product.rating}</span> : null}
          </span>
        </div>
      </button>
    </Surface>
  );

  return (
    <section
      aria-labelledby="booth-recommendations-title"
      className="customer-booth-recommendations customer-panel-transition"
      id={panelId}
      role="tabpanel"
    >
      <div className="customer-booth-recommendations__header">
        <h2 id="booth-recommendations-title">{title}</h2>
      </div>
      <div className="customer-booth-product-columns">
        <div className="customer-booth-product-column">{leftProducts.map(renderProduct)}</div>
        <div className="customer-booth-product-column customer-booth-product-column--offset">
          {rightProducts.map(renderProduct)}
        </div>
      </div>
    </section>
  );
}

type BoothProductDetailProps = {
  onBack: () => void;
  product: BoothProduct;
};

function BoothProductDetail({ onBack, product }: BoothProductDetailProps) {
  const [quantityText, setQuantityText] = useState("1");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const categoryLabels = product.categories.flatMap((categoryId) => {
    const label = boothCategories.find((category) => category.id === categoryId)?.label;
    return label ? [label] : [];
  });
  const originalPriceDmc = Math.ceil(product.priceDmc * 1.28);
  const quantity = Math.min(Math.max(Number.parseInt(quantityText, 10) || 1, 1), 99);
  const totalPriceDmc = product.priceDmc * quantity;
  const quantityInput = (
    <div className="customer-booth-detail-quantity">
      <label htmlFor="booth-product-quantity">개수</label>
      <div className="customer-booth-detail-quantity__control">
        <input
          id="booth-product-quantity"
          inputMode="numeric"
          min={1}
          max={99}
          onBlur={() => setQuantityText(String(quantity))}
          onChange={(event) => {
            const nextValue = event.currentTarget.value.replace(/\D/g, "").slice(0, 2);
            setQuantityText(nextValue);
          }}
          pattern="[0-9]*"
          type="text"
          value={quantityText}
        />
        <span>개</span>
      </div>
    </div>
  );

  if (isCheckingOut) {
    if (isPaymentComplete) {
      return <BoothPaymentComplete onDone={onBack} />;
    }

    return (
      <BoothProductCheckout
        onBack={() => setIsCheckingOut(false)}
        onPay={() => {
          setIsPaymentComplete(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        product={product}
        quantity={quantity}
        totalPriceDmc={totalPriceDmc}
      />
    );
  }

  return (
    <div className="customer-booth-page customer-booth-detail-page">
      <Surface
        asChild
        className="customer-booth-detail-hero"
        padding="none"
        style={{ "--customer-booth-product-image-bg": product.imageBackground } as CSSProperties}
      >
        <section aria-labelledby="booth-product-detail-title">
          <header className="customer-booth-detail-header">
            <IconButton
              aria-label="부스 목록으로 돌아가기"
              className="customer-booth-detail-header__button"
              intent="ghost"
              onClick={onBack}
              type="button"
            >
              <ArrowLeftIcon aria-hidden="true" />
            </IconButton>
            <div className="customer-booth-detail-header__actions">
              <IconButton
                aria-label="공유하기"
                className="customer-booth-detail-header__button"
                intent="ghost"
                type="button"
              >
                <ShareIcon aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="검색"
                className="customer-booth-detail-header__button"
                intent="ghost"
                type="button"
              >
                <MagnifyingGlassIcon aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="장바구니"
                className="customer-booth-detail-header__button"
                intent="ghost"
                type="button"
              >
                <ShoppingBagIcon aria-hidden="true" />
              </IconButton>
            </div>
          </header>
          <img alt="" aria-hidden="true" src={product.imageSrc} />
          <div className="customer-booth-detail-hero__meta">
            <span>비슷한 상품</span>
            <span>1 / 2</span>
          </div>
        </section>
      </Surface>

      <section className="customer-booth-detail-content">
        <div className="customer-booth-detail-tags">
          {categoryLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <h1 id="booth-product-detail-title">{product.title}</h1>
        <div className="customer-booth-detail-price-row">
          <span>28%</span>
          <del>{formatDmc(originalPriceDmc)}</del>
        </div>
        <strong className="customer-booth-detail-price">{formatDmc(product.priceDmc)}</strong>
        <div className="customer-booth-detail-meta">
          <span>
            <EyeIcon aria-hidden="true" />
            {product.meta}
          </span>
          {"rating" in product ? <span>★ {product.rating}</span> : null}
        </div>
        <p>{product.description}</p>
        {quantityInput}
        <dl className="customer-booth-detail-info">
          <div>
            <dt>결제수단</dt>
            <dd>대마페이</dd>
          </div>
          <div>
            <dt>수령방법</dt>
            <dd>현장 부스 교환</dd>
          </div>
          <div>
            <dt>구매제한</dt>
            <dd>하루 최대 1개</dd>
          </div>
        </dl>
      </section>

      <footer className="customer-booth-detail-purchase">
        <button aria-label="찜하기" className="customer-booth-detail-purchase__icon" type="button">
          <HeartIcon aria-hidden="true" />
        </button>
        <button
          aria-label="문의하기"
          className="customer-booth-detail-purchase__icon"
          type="button"
        >
          <ChatBubbleOvalLeftEllipsisIcon aria-hidden="true" />
        </button>
        <button className="customer-booth-detail-purchase__cart" type="button">
          장바구니
        </button>
        <button
          className="customer-booth-detail-purchase__pay"
          onClick={() => {
            setQuantityText(String(quantity));
            setIsCheckingOut(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          type="button"
        >
          구매하기
        </button>
      </footer>
    </div>
  );
}

type BoothProductCheckoutProps = {
  onBack: () => void;
  onPay: () => void;
  product: BoothProduct;
  quantity: number;
  totalPriceDmc: number;
};

function BoothProductCheckout({
  onBack,
  onPay,
  product,
  quantity,
  totalPriceDmc,
}: BoothProductCheckoutProps) {
  return (
    <div className="customer-booth-page customer-booth-checkout-page">
      <header className="customer-booth-checkout-header">
        <IconButton
          aria-label="상품 상세로 돌아가기"
          className="customer-booth-checkout-header__button"
          intent="ghost"
          onClick={onBack}
          type="button"
        >
          <ArrowLeftIcon aria-hidden="true" />
        </IconButton>
        <h1>최종 확인</h1>
      </header>

      <main className="customer-booth-checkout-content">
        <section className="customer-booth-checkout-product" aria-label="결제 상품">
          <img alt="" aria-hidden="true" src={product.imageSrc} />
          <div>
            <span>부스 상품</span>
            <strong>{product.title}</strong>
            <small>{quantity}개</small>
          </div>
        </section>

        <section className="customer-booth-checkout-summary" aria-label="결제 정보">
          <div>
            <span>상품금액</span>
            <strong>{formatDmc(product.priceDmc)}</strong>
          </div>
          <div>
            <span>수량</span>
            <strong>{quantity}개</strong>
          </div>
          <div>
            <span>결제수단</span>
            <strong>대마페이</strong>
          </div>
          <div className="customer-booth-checkout-summary__total">
            <span>총 결제금액</span>
            <strong>{formatDmc(totalPriceDmc)}</strong>
          </div>
        </section>
      </main>

      <footer className="customer-booth-checkout-purchase">
        <button onClick={onPay} type="button">
          결제하기
        </button>
      </footer>
    </div>
  );
}

type BoothPaymentCompleteProps = {
  onDone: () => void;
};

function BoothPaymentComplete({ onDone }: BoothPaymentCompleteProps) {
  return (
    <div className="customer-booth-page customer-booth-complete-page">
      <main className="customer-booth-complete-content" aria-labelledby="booth-payment-complete">
        <span className="customer-booth-complete-icon">
          <svg aria-hidden="true" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="25" />
            <path d="m20 32.5 8.2 8.2L45 23.8" />
          </svg>
        </span>
        <h1 id="booth-payment-complete">결제가 완료됐어요</h1>
      </main>

      <footer className="customer-booth-complete-purchase">
        <button onClick={onDone} type="button">
          완료
        </button>
      </footer>
    </div>
  );
}
