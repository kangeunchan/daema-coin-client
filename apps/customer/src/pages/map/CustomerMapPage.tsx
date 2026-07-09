import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { EyeIcon, HeartIcon } from "@heroicons/react/24/outline";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  ShareIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";
import { IconButton } from "@daema/ui/icon-button";
import { Surface } from "@daema/ui/surface";

import {
  createCustomerCartItem,
  createCustomerBoothOrder,
  createCustomerBoothProductView,
  createCustomerFavorite,
  deleteCustomerFavorite,
  fetchCustomerBoothHome,
  fetchCustomerBoothOrders,
  fetchCustomerCart,
  fetchCustomerFavorites,
} from "../../shared/api/booth";
import type {
  CustomerBoothBannerDto,
  CustomerBoothCategoryDto,
  CustomerBoothDto,
  CustomerBoothProductDto,
  CustomerBoothOrderDto,
  CustomerCartItemDto,
} from "../../shared/api/booth";
import { isCustomerApiEnabled } from "../../shared/api/client";
import { ledgerAmountValue } from "../../shared/api/customerDataMappers";
import { pushCustomerPath } from "../../shared/lib/customerNavigation";
import { useCustomerPathname } from "../../shared/lib/useCustomerPathname";
import { AppHeader } from "../../widgets/app-header";
import {
  formatDmc,
  getProductIdFromPathname,
} from "./model/boothContent";
import type { BoothCategory, BoothCategoryId, BoothProduct } from "./model/boothContent";

type BoothHeroSlide = {
  background: string;
  badge: string;
  imageSrc: string;
  muted?: string;
  note: string;
  subtitle: string;
  title: string;
  tone?: string;
  value: string;
};

type BoothRecommendationsProps = {
  categoryId: BoothCategoryId;
  onProductSelect: (product: BoothProduct) => void;
  panelId: string;
  products: readonly BoothProduct[];
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

const baseBoothCategories = [
  { id: "all", label: "쇼핑 홈", title: "전체 부스 상품" },
] satisfies readonly BoothCategory[];

export function CustomerMapPage() {
  const pathname = useCustomerPathname();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState<BoothCategoryId>("all");
  const [apiCategories, setApiCategories] = useState<readonly BoothCategory[]>(baseBoothCategories);
  const [apiHeroSlides, setApiHeroSlides] = useState<readonly BoothHeroSlide[]>([]);
  const [apiProducts, setApiProducts] = useState<readonly BoothProduct[]>([]);
  const categories = apiCategories;
  const heroSlides = apiHeroSlides;
  const products = apiProducts;
  const isCartPath = pathname === "/booth/cart";
  const isOrdersPath = pathname === "/booth/orders";
  const selectedProductId = getProductIdFromPathname(pathname);
  const visibleCategoryId = categories.some((category) => category.id === activeCategoryId)
    ? activeCategoryId
    : "all";
  const activeCategory = categories.find((category) => category.id === visibleCategoryId);
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const tabPanelId = useId();
  const categoryTabRefs = useRef(new Map<BoothCategoryId, HTMLButtonElement>());

  useEffect(() => {
    if (!selectedProduct || !isCustomerApiEnabled()) {
      return;
    }

    void createCustomerBoothProductView(selectedProduct.id)
      .then((item) => {
        const viewCount = productViewCount(item);
        setApiProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === selectedProduct.id
              ? { ...product, meta: formatProductViews(viewCount), viewCount }
              : product,
          ),
        );
      })
      .catch(() => undefined);
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;

    void fetchCustomerBoothHome()
      .then((home) => {
        if (isCancelled) {
          return;
        }

        const nextCategories = mapBoothCategories(home.categories);
        const nextHeroSlides = mapBoothHeroSlides(home.banners);
        const nextProducts = mapBoothProducts(home.products, home.booths);

        setApiCategories(nextCategories);
        setApiHeroSlides(nextHeroSlides);
        setApiProducts(nextProducts);
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    categoryTabRefs.current.get(visibleCategoryId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [visibleCategoryId]);

  const openProductDetail = (product: BoothProduct) => {
    pushCustomerPath(`/booth/${product.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeProductDetail = () => {
    pushCustomerPath("/booth");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedProduct) {
    return (
      <BoothProductDetail categories={categories} onBack={closeProductDetail} product={selectedProduct} />
    );
  }

  if (isCartPath) {
    return <BoothCartPage onBack={closeProductDetail} />;
  }

  if (isOrdersPath) {
    return <BoothOrdersPage onBack={closeProductDetail} />;
  }

  return (
    <div className="customer-booth-page">
      <AppHeader action="cart" stickyActions />
      <Surface asChild className="customer-booth-category-surface" padding="none">
        <nav aria-label="부스 카테고리">
          <div className="customer-booth-categories" role="tablist">
            {categories.map((category) => (
              <button
                aria-controls={tabPanelId}
                aria-selected={visibleCategoryId === category.id}
                className="customer-booth-category"
                data-active={visibleCategoryId === category.id ? "true" : undefined}
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
      {heroSlides.length > 0 ? (
        <section
          aria-label="부스 추천 상품"
          className="customer-booth-hero-scroller"
          onScroll={(event) => {
            const target = event.currentTarget;
            const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
            setActiveSlide(Math.min(Math.max(nextIndex, 0), heroSlides.length - 1));
          }}
        >
          {heroSlides.map((slide, index) => (
            <Surface
              asChild
              className="customer-booth-hero-card"
              data-tone={slide.tone}
              key={slide.title}
              padding="none"
              style={
                {
                  "--customer-booth-hero-background": slide.background,
                  "--customer-booth-hero-foreground": slide.muted
                    ? "#ffffff"
                    : "var(--daema-color-foreground-default)",
                  "--customer-booth-hero-muted": slide.muted ?? "rgb(15 23 42 / 0.66)",
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
                  {index + 1} / {heroSlides.length}
                </span>
              </article>
            </Surface>
          ))}
        </section>
      ) : null}
      <BoothRecommendations
        categoryId={visibleCategoryId}
        key={activeCategoryId}
        onProductSelect={openProductDetail}
        panelId={tabPanelId}
        products={products}
        title={activeCategory?.title ?? "전체 부스 상품"}
      />
    </div>
  );
}

function BoothRecommendations({
  categoryId,
  onProductSelect,
  panelId,
  products,
  title,
}: BoothRecommendationsProps) {
  const [darkImageBySrc, setDarkImageBySrc] = useState<Record<string, boolean>>({});
  const filteredProducts =
    categoryId === "all"
      ? products
      : products.filter((product) =>
          (product.categories as readonly BoothCategoryId[]).includes(categoryId),
        );
  const displayProducts = filteredProducts.map((product) => ({
    ...product,
    instanceId: product.id,
  }));
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
          <span className="customer-booth-product-card__price">{formatDmc(product.priceDmc)}</span>
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
      {filteredProducts.length === 0 ? (
        <p className="customer-booth-empty">표시할 상품이 없습니다.</p>
      ) : null}
    </section>
  );
}

type BoothCartPageProps = {
  onBack: () => void;
};

function BoothCartPage({ onBack }: BoothCartPageProps) {
  const [items, setItems] = useState<readonly CustomerCartItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPayingId, setIsPayingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isCancelled = false;

    void fetchCustomerCart()
      .then((nextItems) => {
        if (!isCancelled) {
          setItems(nextItems);
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : "장바구니를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const payCartItem = (item: CustomerCartItemDto) => {
    const productId = item.productId;
    if (!productId) {
      return;
    }

    void (async () => {
      setIsPayingId(cartItemID(item));
      setError("");
      setNotice("");
      try {
        await createCustomerBoothOrder({ productId, quantity: cartItemQuantity(item) });
        setNotice("주문이 접수됐습니다.");
      } catch (payError) {
        setError(payError instanceof Error ? payError.message : "주문을 완료하지 못했습니다.");
      } finally {
        setIsPayingId("");
      }
    })();
  };

  return (
    <div className="customer-booth-page customer-booth-list-page">
      <BoothSubpageHeader onBack={onBack} title="장바구니" />
      <main className="customer-booth-list-content">
        {isLoading ? <p className="customer-booth-empty">장바구니를 불러오는 중입니다.</p> : null}
        {error ? <p className="customer-booth-list-message" data-error="true">{error}</p> : null}
        {notice ? <p className="customer-booth-list-message">{notice}</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className="customer-booth-empty">장바구니에 담긴 상품이 없습니다.</p>
        ) : null}
        <div className="customer-booth-list">
          {items.map((item) => {
            const itemId = cartItemID(item);
            return (
              <article className="customer-booth-list-item" key={itemId}>
                <img alt="" aria-hidden="true" src={cartItemImage(item)} />
                <div>
                  <span>부스 상품</span>
                  <strong>{cartItemTitle(item)}</strong>
                  <small>{cartItemQuantity(item)}개</small>
                </div>
                <div className="customer-booth-list-item__side">
                  <b>{formatDmc(cartItemTotalDmc(item))}</b>
                  <button
                    disabled={isPayingId === itemId}
                    onClick={() => payCartItem(item)}
                    type="button"
                  >
                    {isPayingId === itemId ? "주문 중" : "주문"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

type BoothOrdersPageProps = {
  onBack: () => void;
};

function BoothOrdersPage({ onBack }: BoothOrdersPageProps) {
  const [orders, setOrders] = useState<readonly CustomerBoothOrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    void fetchCustomerBoothOrders()
      .then((nextOrders) => {
        if (!isCancelled) {
          setOrders(nextOrders);
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : "주문 내역을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="customer-booth-page customer-booth-list-page">
      <BoothSubpageHeader onBack={onBack} title="주문 내역" />
      <main className="customer-booth-list-content">
        {isLoading ? <p className="customer-booth-empty">주문 내역을 불러오는 중입니다.</p> : null}
        {error ? <p className="customer-booth-list-message" data-error="true">{error}</p> : null}
        {!isLoading && orders.length === 0 ? (
          <p className="customer-booth-empty">아직 주문한 상품이 없습니다.</p>
        ) : null}
        <div className="customer-booth-list">
          {orders.map((order) => (
            <article className="customer-booth-list-item customer-booth-list-item--order" key={orderID(order)}>
              <span className="customer-booth-list-item__receipt">
                <ReceiptPercentIcon aria-hidden="true" />
              </span>
              <div>
                <span>{formatOrderDate(order.createdAt)}</span>
                <strong>{orderTitle(order)}</strong>
                <small>{orderQuantity(order)}개 · {orderStatusLabel(order.status)}</small>
              </div>
              <div className="customer-booth-list-item__side">
                <b>{formatDmc(orderTotalDmc(order))}</b>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

type BoothSubpageHeaderProps = {
  onBack: () => void;
  title: string;
};

function BoothSubpageHeader({ onBack, title }: BoothSubpageHeaderProps) {
  return (
    <header className="customer-booth-checkout-header">
      <IconButton
        aria-label="부스 목록으로 돌아가기"
        className="customer-booth-checkout-header__button"
        intent="ghost"
        onClick={onBack}
        type="button"
      >
        <ArrowLeftIcon aria-hidden="true" />
      </IconButton>
      <h1>{title}</h1>
    </header>
  );
}

type BoothProductDetailProps = {
  categories: readonly BoothCategory[];
  onBack: () => void;
  product: BoothProduct;
};

function BoothProductDetail({ categories, onBack, product }: BoothProductDetailProps) {
  const [quantityText, setQuantityText] = useState("1");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const categoryLabels = product.categories.flatMap((categoryId) => {
    const label = categories.find((category) => category.id === categoryId)?.label;
    return label ? [label] : [];
  });
  const quantity = Math.min(Math.max(Number.parseInt(quantityText, 10) || 1, 1), 99);
  const totalPriceDmc = product.priceDmc * quantity;

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;

    void fetchCustomerFavorites(product.id)
      .then((items) => {
        if (!isCancelled) {
          setIsFavorite(items.some((item) => item.targetId === product.id));
        }
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [product.id]);

  const addToCart = () => {
    void (async () => {
      if (isAddingCart) {
        return;
      }
      setIsAddingCart(true);
      setCartMessage("");
      setCartError("");
      try {
        await createCustomerCartItem({ productId: product.id, quantity });
        setCartMessage("장바구니에 담았습니다.");
      } catch (error) {
        setCartError(error instanceof Error ? error.message : "장바구니에 담지 못했습니다.");
      } finally {
        setIsAddingCart(false);
      }
    })();
  };

  const toggleFavorite = () => {
    void (async () => {
      if (isFavoriteSaving) {
        return;
      }
      setIsFavoriteSaving(true);
      try {
        if (isFavorite) {
          await deleteCustomerFavorite(product.id);
          setIsFavorite(false);
        } else {
          await createCustomerFavorite({ targetId: product.id, targetType: "product" });
          setIsFavorite(true);
        }
      } catch {
        setIsFavorite((current) => current);
      } finally {
        setIsFavoriteSaving(false);
      }
    })();
  };

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
        error={checkoutError}
        isPaying={isPaying}
        onPay={() => {
          void (async () => {
            if (isPaying) {
              return;
            }
            setIsPaying(true);
            setCheckoutError("");
            try {
              await createCustomerBoothOrder({ productId: product.id, quantity });
              setIsPaymentComplete(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            } catch (error) {
              setCheckoutError(error instanceof Error ? error.message : "결제를 완료하지 못했습니다.");
            } finally {
              setIsPaying(false);
            }
          })();
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
                onClick={() => pushCustomerPath("/booth/cart")}
                type="button"
              >
                <ShoppingBagIcon aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="주문 내역"
                className="customer-booth-detail-header__button"
                intent="ghost"
                onClick={() => pushCustomerPath("/booth/orders")}
                type="button"
              >
                <ReceiptPercentIcon aria-hidden="true" />
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
          {product.boothName || product.boothId ? (
            <div>
              <dt>판매 부스</dt>
              <dd>{product.boothName ?? product.boothId}</dd>
            </div>
          ) : null}
          <div>
            <dt>결제수단</dt>
            <dd>대마페이</dd>
          </div>
          <div>
            <dt>수령방법</dt>
            <dd>현장 부스 교환</dd>
          </div>
        </dl>
      </section>

      <footer className="customer-booth-detail-purchase">
        <button
          aria-label={isFavorite ? "찜 취소" : "찜하기"}
          className="customer-booth-detail-purchase__icon"
          data-active={isFavorite ? "true" : undefined}
          disabled={isFavoriteSaving}
          onClick={toggleFavorite}
          type="button"
        >
          <HeartIcon aria-hidden="true" />
        </button>
        <button
          className="customer-booth-detail-purchase__cart"
          disabled={isAddingCart}
          onClick={addToCart}
          type="button"
        >
          {isAddingCart ? "담는 중" : "장바구니"}
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
        {cartMessage || cartError ? (
          <p
            className="customer-booth-detail-purchase__message"
            data-error={cartError ? "true" : undefined}
          >
            {cartError || cartMessage}
          </p>
        ) : null}
      </footer>
    </div>
  );
}

function categoryID(value: string | undefined): BoothCategoryId {
  const normalized = value?.trim();
  if (
    normalized === "booth" ||
    normalized === "rest" ||
    normalized === "experience" ||
    normalized === "food"
  ) {
    return normalized;
  }
  return "booth";
}

function mapBoothCategories(items: readonly CustomerBoothCategoryDto[] | undefined) {
  const categories = (items ?? [])
    .map((item) => {
      const id = categoryID(item.id ?? item.categoryId);
      const label = item.label ?? item.name ?? item.title ?? id;
      return { id, label, title: item.title ?? label };
    })
    .filter((category) => category.id !== "all");

  return [{ id: "all", label: "쇼핑 홈", title: "전체 부스 상품" }, ...categories] satisfies
    BoothCategory[];
}

function mapBoothHeroSlides(items: readonly CustomerBoothBannerDto[] | undefined) {
  return (items ?? []).map((item) => ({
    badge: item.badge ?? "부스 추천",
    background: item.background ?? "#fffbf5",
    imageSrc: item.imageSrc ?? item.imageUrl ?? "/3dicons/coin.png",
    muted: item.muted,
    note: item.note ?? "현장 부스에서 바로 이용",
    subtitle: item.subtitle ?? "",
    title: item.title ?? "부스 상품",
    tone: item.tone,
    value: item.value ?? "",
  })) as BoothHeroSlide[];
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }
  return [];
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function cartItemID(item: CustomerCartItemDto) {
  return item.id ?? item.cartItemId ?? item.productId ?? cartItemTitle(item);
}

function cartItemTitle(item: CustomerCartItemDto) {
  return item.title ?? item.name ?? String(item.productId ?? "부스 상품");
}

function cartItemImage(item: CustomerCartItemDto) {
  return item.imageSrc ?? item.imageUrl ?? item.thumbnail ?? "/3dicons/coin.png";
}

function cartItemQuantity(item: CustomerCartItemDto) {
  return Math.max(1, Math.trunc(numberValue(item.quantity) ?? 1));
}

function cartItemUnitDmc(item: CustomerCartItemDto) {
  return ledgerAmountValue(item.unitAmount) || ledgerAmountValue(item.price) || 0;
}

function cartItemTotalDmc(item: CustomerCartItemDto) {
  return cartItemUnitDmc(item) * cartItemQuantity(item);
}

function orderID(order: CustomerBoothOrderDto) {
  return order.id ?? order.orderId ?? `${order.productId ?? orderTitle(order)}-${order.createdAt ?? ""}`;
}

function orderTitle(order: CustomerBoothOrderDto) {
  return order.productName ?? order.item ?? String(order.productId ?? "부스 상품");
}

function orderQuantity(order: CustomerBoothOrderDto) {
  return Math.max(1, Math.trunc(numberValue(order.quantity) ?? 1));
}

function orderTotalDmc(order: CustomerBoothOrderDto) {
  return ledgerAmountValue(order.totalAmount) || ledgerAmountValue(order.amount) || 0;
}

function orderStatusLabel(status: string | undefined) {
  switch (status) {
    case "completed":
      return "완료";
    case "ready":
      return "준비 완료";
    case "cancelled":
      return "취소";
    case "paid":
      return "결제 완료";
    default:
      return "주문 접수";
  }
}

function formatOrderDate(value: string | undefined) {
  if (!value) {
    return "주문 일시 없음";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function productViewCount(item: CustomerBoothProductDto) {
  return Math.max(0, Math.trunc(numberValue(item.viewCount) ?? numberValue(item.view_count) ?? 0));
}

function formatProductViews(count: number) {
  return `조회 ${count.toLocaleString("ko-KR")}회`;
}

function boothNameById(items: readonly CustomerBoothDto[] | undefined) {
  return new Map(
    (items ?? []).flatMap((item) => {
      const id = item.id;
      const name = item.name;
      return id && name ? [[id, name] as const] : [];
    }),
  );
}

function mapBoothProducts(
  items: readonly CustomerBoothProductDto[] | undefined,
  booths?: readonly CustomerBoothDto[],
) {
  const boothNames = boothNameById(booths);

  return (items ?? [])
    .map((item): BoothProduct | undefined => {
      const id = item.id ?? item.productId;
      const title = item.title ?? item.name;
      if (!id || !title) {
        return undefined;
      }

      const categoryValues = [
        ...stringList(item.categories),
        ...stringList(item.categoryId),
        ...stringList(item.category),
      ];
      const categories: BoothCategoryId[] =
        categoryValues.length > 0 ? categoryValues.map(categoryID) : ["booth"];
      const price =
        ledgerAmountValue(item.salePrice) || ledgerAmountValue(item.price) || item.priceDmc || 0;
      const viewCount = productViewCount(item);

      const product: BoothProduct = {
        categories,
        description: item.description ?? "부스에서 구매할 수 있는 상품입니다.",
        id,
        imageBackground: item.imageBackground ?? "#e9edf4",
        imageSrc: item.imageSrc ?? item.imageUrl ?? item.thumbnail ?? "/3dicons/coin.png",
        meta: formatProductViews(viewCount),
        priceDmc: price,
        title,
        viewCount,
      };
      if (item.boothId) {
        product.boothId = item.boothId;
        const boothName = boothNames.get(item.boothId);
        if (boothName) {
          product.boothName = boothName;
        }
      }
      if (item.rating) {
        product.rating = item.rating;
      }
      return product;
    })
    .filter((product): product is BoothProduct => product !== undefined && product.priceDmc > 0);
}

type BoothProductCheckoutProps = {
  error: string;
  isPaying: boolean;
  onBack: () => void;
  onPay: () => void;
  product: BoothProduct;
  quantity: number;
  totalPriceDmc: number;
};

function BoothProductCheckout({
  error,
  isPaying,
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
        {error ? <p className="customer-booth-checkout-error">{error}</p> : null}
        <button disabled={isPaying} onClick={onPay} type="button">
          {isPaying ? "결제 중" : "결제하기"}
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
