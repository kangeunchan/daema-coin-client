import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpDown,
  Bell,
  Box,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  ImageUp,
  LogOut,
  Minus,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  ShoppingBag,
  Store,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { SellerApiError } from "./api";
import type {
  SellerBooth,
  SellerDashboard,
  SellerMe,
  SellerMoney,
  SellerOrder,
  SellerPayBarcode,
  SellerPayment,
  SellerProduct,
  SellerSalesReport,
  SellerUpload,
} from "./api";
import { getBarcodeScanBox } from "./payScanner";

const payScannerElementId = "seller-pay-camera-reader";
const paymentStepLabels = ["상품", "스캔", "승인"] as const;

const productCategoryOptions = [
  { label: "음식", value: "food" },
  { label: "체험", value: "experience" },
] as const;

function productCategoryLabel(value: string) {
  return productCategoryOptions.find((category) => category.value === value)?.label ?? value;
}

function productCategoryValue(value: string | undefined) {
  if (value === "experience" || value === "체험") {
    return "experience";
  }
  return "food";
}

type SellerSalesDashboardProps = {
  booth?: SellerBooth | undefined;
  booths: readonly SellerBooth[];
  dashboard?: SellerDashboard | undefined;
  mode?: "full" | "payment-only";
  onCreateProduct?:
    | ((
        boothId: string,
        input: {
          category?: string;
          description?: string;
          imageUrl?: string;
          price: number;
          stock?: number;
          thumbnail?: string;
          title: string;
        },
      ) => Promise<SellerProduct>)
    | undefined;
  onDeleteProduct?: ((productId: string) => Promise<void>) | undefined;
  onCaptureBarcodePayment?:
    | ((input: {
        amount: number;
        code: string;
        description?: string;
        idempotencyKey?: string;
      }) => Promise<SellerPayment>)
    | undefined;
  onLookupPayBarcode?: ((code: string) => Promise<SellerPayBarcode>) | undefined;
  onLogout?: (() => void) | undefined;
  onUpdateOrderStatus?: ((orderId: string, status: string) => Promise<SellerOrder>) | undefined;
  onUpdateProduct?:
    | ((
        productId: string,
        input: {
          category?: string;
          status?: string;
          stock?: number;
        },
      ) => Promise<SellerProduct>)
    | undefined;
  onUploadProductImage?:
    | ((input: { boothId?: string; file: File; productId?: string }) => Promise<SellerUpload>)
    | undefined;
  orders?: readonly SellerOrder[] | undefined;
  products?: readonly SellerProduct[] | undefined;
  report?: SellerSalesReport | undefined;
  session: SellerMe;
};

type SellerProductItem = {
  category: string;
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  sold: number;
  status: string;
  stock: number;
};

type SellerOrderItem = {
  name: string;
  options: string[];
  quantity: number;
};

type SellerOrderItemRow = {
  completed: boolean;
  id: string;
  item: string;
  items: SellerOrderItem[];
  name: string;
  time: string;
  tone: "normal" | "ready" | "urgent";
};

type SalesView = "home" | "inventory" | "orders" | "payment" | "product-new" | "settlement";
type PaymentView = "all" | "captured" | "refunded";
type OrderView = "all" | "completed" | "pending";
type OrderSort = "newest" | "oldest";

function amountValue(value: SellerMoney | number | undefined) {
  return typeof value === "number" ? value : (value?.value ?? 0);
}

function formatAmount(value: SellerMoney | number | undefined) {
  if (typeof value === "object" && value?.formatted) return value.formatted;
  return `${amountValue(value).toLocaleString("ko-KR")} DMC`;
}

function numericRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") {
      return value;
    }
    if (value && typeof value === "object" && "value" in value) {
      const amount = (value as SellerMoney).value;
      if (typeof amount === "number") {
        return amount;
      }
    }
  }
  return 0;
}

function textRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function mapSellerProductItem(product: SellerProduct): SellerProductItem | undefined {
  const id = product.id ?? product.productId;
  const name = product.title ?? product.name;
  if (!id || !name) {
    return undefined;
  }
  const originalPrice = numericRecordValue(product, ["price", "originalPrice"]);
  const salePrice = numericRecordValue(product, ["salePrice"]) || originalPrice;
  const item: SellerProductItem = {
    category: productCategoryValue(textRecordValue(product, ["category", "categoryId"])),
    id,
    name,
    price: salePrice,
    sold: numericRecordValue(product, ["sold", "soldCount", "todaySold"]),
    status: product.status ?? "판매 중",
    stock: numericRecordValue(product, ["stock", "stockQuantity"]),
  };
  const imageUrl = textRecordValue(product, ["imageUrl", "thumbnail"]);
  if (imageUrl) {
    item.imageUrl = imageUrl;
  }
  return item;
}

function orderItemName(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textRecordValue(record, ["name", "title", "productName"]) ?? "상품";
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return "상품";
}

function orderItemQuantity(value: unknown) {
  if (value && typeof value === "object") {
    const quantity = numericRecordValue(value as Record<string, unknown>, ["quantity", "count"]);
    return quantity > 0 ? quantity : 1;
  }
  return 1;
}

function orderItemOptions(value: unknown) {
  if (!value || typeof value !== "object") {
    return [];
  }
  const options = (value as Record<string, unknown>).options;
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => (typeof option === "string" ? option : String(option)))
    .filter((option) => option.trim().length > 0);
}

function orderItems(value: unknown, fallbackName: string): SellerOrderItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ name: fallbackName, options: [], quantity: 1 }];
  }
  return value.map((item) => ({
    name: orderItemName(item),
    options: orderItemOptions(item),
    quantity: orderItemQuantity(item),
  }));
}

function relativeOrderTime(value: string | undefined) {
  if (!value) {
    return "방금 전";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) {
    return "방금 전";
  }
  if (minutes < 60) {
    return `${minutes}분 전`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }
  return `${Math.floor(hours / 24)}일 전`;
}

function orderCompleted(status: string | undefined) {
  return ["completed", "done", "picked_up", "pickup_completed", "fulfilled", "cancelled", "refunded"].includes(
    status?.toLocaleLowerCase("en-US") ?? "",
  );
}

function mapSellerOrderItem(order: SellerOrder): SellerOrderItemRow | undefined {
  const id = order.id ?? order.orderId;
  if (!id) {
    return undefined;
  }
  const item = order.item ?? order.productName ?? order.title ?? "현장 주문";
  const name = order.customerName ?? order.name ?? "고객";
  const createdAt = order.createdAt ?? order.updatedAt;
  const completed = orderCompleted(order.status);
  const minutes = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000) : 0;
  return {
    completed,
    id,
    item,
    items: orderItems(order.items, item),
    name,
    time: relativeOrderTime(createdAt),
    tone: completed ? "ready" : minutes >= 10 ? "urgent" : "normal",
  };
}

function formatPaymentTime(value: string | undefined) {
  if (!value) return "방금 전";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(date);
}

function normalizePayBarcodeInput(value: string) {
  const trimmed = value.trim().replace(/^DAEMA-PAY:/i, "");
  const normalized = trimmed.includes(":") ? trimmed.split(":").at(-1)! : trimmed;

  return normalized.replace(/[^a-zA-Z0-9_-]/g, "");
}

function formatBarcodeOwner(barcode: SellerPayBarcode | undefined) {
  if (!barcode) {
    return "바코드를 조회하세요";
  }
  return barcode.displayName ?? barcode.name ?? barcode.studentNo ?? barcode.customerId ?? barcode.userId ?? "고객";
}

function sellerDashboardErrorMessage(error: unknown) {
  if (error instanceof SellerApiError) {
    return error.message;
  }
  return "요청을 처리하지 못했습니다.";
}

export function SellerSalesDashboard({
  booth,
  booths,
  dashboard,
  mode = "full",
  onCaptureBarcodePayment,
  onCreateProduct,
  onDeleteProduct,
  onLookupPayBarcode,
  onLogout,
  onUpdateOrderStatus,
  onUpdateProduct,
  onUploadProductImage,
  orders: apiOrders = [],
  products: apiProducts = [],
  report,
  session,
}: SellerSalesDashboardProps) {
  const isPaymentOnlyMode = mode === "payment-only";
  const [activeView, setActiveView] = useState<SalesView>(isPaymentOnlyMode ? "payment" : "orders");
  const [paymentView, setPaymentView] = useState<PaymentView>("all");
  const [orderView, setOrderView] = useState<OrderView>("pending");
  const [orderSort, setOrderSort] = useState<OrderSort>("oldest");
  const [searchQuery, setSearchQuery] = useState("");
  const [newProduct, setNewProduct] = useState({
    category: "food",
    description: "",
    name: "",
    price: "",
    stock: "",
  });
  const [selectedProductImage, setSelectedProductImage] = useState<File | undefined>();
  const [productImagePreviewUrl, setProductImagePreviewUrl] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productCreateError, setProductCreateError] = useState("");
  const [payCode, setPayCode] = useState("");
  const [selectedPayProductId, setSelectedPayProductId] = useState("");
  const [payQuantity, setPayQuantity] = useState(1);
  const [paymentStep, setPaymentStep] = useState(0);
  const [payBarcode, setPayBarcode] = useState<SellerPayBarcode | undefined>();
  const [payStatusMessage, setPayStatusMessage] = useState("");
  const [payError, setPayError] = useState("");
  const [payScannerError, setPayScannerError] = useState("");
  const [isPayScannerActive, setIsPayScannerActive] = useState(false);
  const [isStartingPayScanner, setIsStartingPayScanner] = useState(false);
  const [isLookingUpPayBarcode, setIsLookingUpPayBarcode] = useState(false);
  const [isCapturingPayment, setIsCapturingPayment] = useState(false);
  const payScannerRef = useRef<
    { clear: () => void; isScanning?: boolean; stop: () => Promise<void> } | undefined
  >(undefined);
  const payScanLockRef = useRef(false);
  const payCodeInputRef = useRef<HTMLInputElement>(null);
  const productImagePreviewUrlRef = useRef("");

  useEffect(() => {
    return () => {
      if (productImagePreviewUrlRef.current) {
        URL.revokeObjectURL(productImagePreviewUrlRef.current);
      }
    };
  }, []);

  const stopPayCameraScanner = useCallback(() => {
    void (async () => {
      const scanner = payScannerRef.current;
      if (!scanner) {
        setIsPayScannerActive(false);
        setIsStartingPayScanner(false);
        return;
      }
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // Camera stream may already be closed by the browser.
      } finally {
        payScannerRef.current = undefined;
        payScanLockRef.current = false;
        setIsPayScannerActive(false);
        setIsStartingPayScanner(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (activeView !== "payment") {
      stopPayCameraScanner();
    }
  }, [activeView, stopPayCameraScanner]);

  useEffect(() => {
    return () => stopPayCameraScanner();
  }, [stopPayCameraScanner]);

  useEffect(() => {
    if (!isPaymentOnlyMode || paymentStep !== 1) {
      return;
    }

    payCodeInputRef.current?.focus();
  }, [isPaymentOnlyMode, paymentStep]);

  const selectProductImage = (file: File | undefined) => {
    if (productImagePreviewUrlRef.current) {
      URL.revokeObjectURL(productImagePreviewUrlRef.current);
      productImagePreviewUrlRef.current = "";
    }
    setSelectedProductImage(file);
    if (!file) {
      setProductImagePreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    productImagePreviewUrlRef.current = objectUrl;
    setProductImagePreviewUrl(objectUrl);
  };
  const [completedOrderIds, setCompletedOrderIds] = useState<string[]>([]);
  const [lastCompletedOrderId, setLastCompletedOrderId] = useState<string | null>(null);
  const [productStocks, setProductStocks] = useState<Record<string, number>>({});
  const [productStatuses, setProductStatuses] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const payments = (report?.payments ?? []).slice(0, 6);
  const revenue = report?.totalAmount ?? dashboard?.revenue;
  const paymentCount = report?.paymentCount ?? dashboard?.paymentCount ?? 0;
  const boothName = booth?.name ?? session.displayName ?? "축제 부스";
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("ko-KR");
  const mappedApiProducts = useMemo(
    () =>
      apiProducts
        .map(mapSellerProductItem)
        .filter((product): product is SellerProductItem => product !== undefined),
    [apiProducts],
  );
  const apiProductStocks = useMemo(
    () => Object.fromEntries(mappedApiProducts.map((product) => [product.id, product.stock])),
    [mappedApiProducts],
  );
  const apiProductStatuses = useMemo(
    () => Object.fromEntries(mappedApiProducts.map((product) => [product.id, product.status])),
    [mappedApiProducts],
  );
  const currentProductStocks = { ...apiProductStocks, ...productStocks };
  const currentProductStatuses = { ...apiProductStatuses, ...productStatuses };
  const products = mappedApiProducts;
  const orders = useMemo(
    () =>
      apiOrders
        .map(mapSellerOrderItem)
        .filter((order): order is SellerOrderItemRow => order !== undefined),
    [apiOrders],
  );
  const pendingOrders = orders.filter(
    (order) => !order.completed && !completedOrderIds.includes(order.id),
  );
  const completedOrderIdSet = new Set([
    ...orders.filter((order) => order.completed).map((order) => order.id),
    ...completedOrderIds,
  ]);
  const completedOrderCount = completedOrderIdSet.size;
  const lowStockProducts = products.filter(
    (product) => (currentProductStocks[product.id] ?? product.stock) < 10,
  );
  const todaySoldCount = products.reduce((total, product) => total + product.sold, 0);
  const activeBoothId = booth?.id ?? booths[0]?.id ?? session.boothId ?? "";
  const visiblePendingOrders = pendingOrders.filter((order) =>
    [order.id, order.item, order.name].some((value) =>
      value.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
    ),
  );
  const visiblePayments = payments.filter((payment) => {
    const matchesStatus = paymentView === "all" || payment.status === paymentView;
    const matchesQuery = [payment.id, payment.productName, payment.customerName].some((value) =>
      value?.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
    );
    return matchesStatus && matchesQuery;
  });
  const visibleProducts = products.filter((product) =>
    [product.id, product.name].some((value) =>
      value.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
    ),
  );
  const selectedPayProduct = products.find((product) => product.id === selectedPayProductId);
  const selectedPayProductStock = selectedPayProduct
    ? (currentProductStocks[selectedPayProduct.id] ?? selectedPayProduct.stock)
    : 0;
  const payTotalAmount = selectedPayProduct ? selectedPayProduct.price * payQuantity : 0;
  const visibleOrders = orders.filter((order) => {
    const completed = order.completed || completedOrderIds.includes(order.id);
    const matchesView =
      orderView === "all" ||
      (orderView === "completed" && completed) ||
      (orderView === "pending" && !completed);
    const matchesQuery = [order.id, order.item, order.name].some((value) =>
      value.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
    );
    return matchesView && matchesQuery;
  });
  const sortedVisibleOrders = orderSort === "oldest" ? visibleOrders : [...visibleOrders].reverse();
  useEffect(() => {
    const handleAppShortcut = (event: KeyboardEvent) => {
      if (isPaymentOnlyMode) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isEditing) {
        if (event.key === "Escape" && target instanceof HTMLElement) {
          target.blur();
          setSearchQuery("");
        }
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      const destination = {
        "1": "home",
        "2": "orders",
        "3": "inventory",
        "4": "payment",
        "5": "settlement",
      }[event.key] as SalesView | undefined;

      if (destination) {
        event.preventDefault();
        setActiveView(destination);
        return;
      }

      if (event.key === "Escape" && activeView === "product-new") {
        setActiveView("inventory");
      }
    };
    window.addEventListener("keydown", handleAppShortcut);
    return () => window.removeEventListener("keydown", handleAppShortcut);
  }, [activeView, isPaymentOnlyMode]);

  const lookupPayBarcode = (rawCode = payCode) => {
    void (async () => {
      if (!onLookupPayBarcode) {
        setPayError("바코드 조회 API가 연결되지 않았습니다.");
        return;
      }
      const code = normalizePayBarcodeInput(rawCode);
      if (!code) {
        setPayError("바코드 번호를 입력하세요.");
        return;
      }
      setIsLookingUpPayBarcode(true);
      setPayError("");
      setPayStatusMessage("");
      try {
        const barcode = await onLookupPayBarcode(code);
        setPayBarcode(barcode);
        setPayCode(barcode.code ?? code);
        setPayStatusMessage("사용 가능한 바코드입니다.");
      } catch (error) {
        setPayBarcode(undefined);
        setPayError(sellerDashboardErrorMessage(error));
      } finally {
        setIsLookingUpPayBarcode(false);
      }
    })();
  };

  const startPayCameraScanner = () => {
    void (async () => {
      if (isStartingPayScanner || isPayScannerActive) {
        return;
      }
      setIsStartingPayScanner(true);
      setPayScannerError("");
      setPayStatusMessage("");
      setPayError("");
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(payScannerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.ITF,
          ],
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        payScannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            aspectRatio: 16 / 9,
            disableFlip: false,
            fps: 10,
            qrbox: getBarcodeScanBox,
          },
          (decodedText) => {
            const code = normalizePayBarcodeInput(decodedText);
            if (!code || payScanLockRef.current) {
              return;
            }
            payScanLockRef.current = true;
            setPayCode(code);
            setPayBarcode(undefined);
            setPayScannerError("");
            setPayStatusMessage("바코드를 스캔했습니다. 고객 정보를 조회합니다.");
            stopPayCameraScanner();
            lookupPayBarcode(code);
          },
          undefined,
        );
        setIsPayScannerActive(true);
      } catch {
        setPayScannerError("카메라를 열지 못했습니다. 브라우저 권한과 HTTPS/localhost 환경을 확인하세요.");
        stopPayCameraScanner();
      } finally {
        setIsStartingPayScanner(false);
      }
    })();
  };

  const captureBarcodePayment = () => {
    void (async () => {
      if (!onCaptureBarcodePayment) {
        setPayError("결제 승인 API가 연결되지 않았습니다.");
        return;
      }
      const code = normalizePayBarcodeInput(payBarcode?.code ?? payCode);
      if (!code) {
        setPayError("먼저 바코드를 조회하세요.");
        return;
      }
      if (!selectedPayProduct) {
        setPayError("결제할 상품을 선택하세요.");
        return;
      }
      if (!Number.isFinite(payTotalAmount) || payTotalAmount <= 0) {
        setPayError("상품 가격을 확인하세요.");
        return;
      }
      if (selectedPayProductStock <= 0) {
        setPayError("품절된 상품은 결제할 수 없습니다.");
        return;
      }
      setIsCapturingPayment(true);
      setPayError("");
      setPayStatusMessage("");
      try {
        const payment = await onCaptureBarcodePayment({
          amount: payTotalAmount,
          code,
          description:
            payQuantity > 1 ? `${selectedPayProduct.name} ${payQuantity}개` : selectedPayProduct.name,
          idempotencyKey: `seller-pay-${activeBoothId}-${selectedPayProduct.id}-${code}-${payTotalAmount}-${Date.now()}`,
        });
        setPayStatusMessage(`${selectedPayProduct.name} ${formatAmount(payment.amount ?? payTotalAmount)} 결제가 완료됐습니다.`);
        setPayBarcode(undefined);
        setPayCode("");
        setPayQuantity(1);
        if (isPaymentOnlyMode) {
          setSelectedPayProductId("");
          setPaymentStep(0);
        }
      } catch (error) {
        setPayError(sellerDashboardErrorMessage(error));
      } finally {
        setIsCapturingPayment(false);
      }
    })();
  };

  const openPaymentRoute = () => {
    window.location.assign("/pay");
  };

  return (
    <div className="sales-day-page" data-mode={isPaymentOnlyMode ? "payment-only" : undefined}>
      {!isPaymentOnlyMode ? (
      <header className="sales-web-header">
        <div className="sales-web-header__inner">
          <div className="sales-brand">
            <span className="sales-brand__mark">d</span>
            <span>
              <strong>daema</strong>
              <small>sales</small>
            </span>
          </div>
          <nav aria-label="판매자 메뉴" className="sales-web-nav">
            <button
              aria-current={activeView === "home" ? "page" : undefined}
              aria-label="운영 현황"
              onClick={() => setActiveView("home")}
              type="button"
            >
              현황
            </button>
            <button
              aria-current={activeView === "orders" ? "page" : undefined}
              aria-label="주문 처리"
              onClick={() => setActiveView("orders")}
              type="button"
            >
              주문
              {pendingOrders.length > 0 ? <b>{pendingOrders.length}</b> : null}
            </button>
            <button
              aria-current={
                activeView === "inventory" || activeView === "product-new" ? "page" : undefined
              }
              aria-label="상품과 재고"
              onClick={() => setActiveView("inventory")}
              type="button"
            >
              상품·재고
            </button>
            <button
              aria-current={activeView === "payment" ? "page" : undefined}
              aria-label="바코드 결제"
              onClick={openPaymentRoute}
              type="button"
            >
              결제
            </button>
            <button
              aria-current={activeView === "settlement" ? "page" : undefined}
              aria-label="정산"
              onClick={() => setActiveView("settlement")}
              type="button"
            >
              정산
            </button>
          </nav>
          <div className="sales-web-actions">
            <div className="sales-live-indicator">
              <i />
              주문 접수 중
            </div>
            <label>
              <Search aria-hidden="true" />
              <input
                aria-label="주문 검색"
                aria-keyshortcuts="/"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="주문, 고객, 상품 검색"
                ref={searchInputRef}
                value={searchQuery}
              />
              <kbd>/</kbd>
            </label>
            <button aria-label="알림" type="button">
              <Bell aria-hidden="true" />
              <i />
            </button>
            <button className="sales-store-button" type="button">
              <Store aria-hidden="true" />
              {boothName}
              <ChevronDown aria-hidden="true" />
            </button>
            {onLogout ? (
              <button aria-label="로그아웃" onClick={onLogout} type="button">
                <LogOut aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </header>
      ) : null}

      <main className="sales-day-main">
        {activeView === "home" ? (
          <>
            <section className="sales-day-hero" aria-labelledby="sales-day-title">
              <div className="sales-day-hero__top">
                <span>
                  <CalendarDays aria-hidden="true" />
                  축제 운영일 · 7월 1일
                </span>
                <button type="button">
                  <Download aria-hidden="true" />
                  매출 내역 받기
                </button>
              </div>
              <div className="sales-day-hero__amount">
                <p id="sales-day-title">오늘 매출</p>
                <h1>{formatAmount(revenue)}</h1>
                <span>결제 완료 금액 기준</span>
              </div>
              <dl className="sales-day-summary">
                <div>
                  <dt>
                    <ShoppingBag aria-hidden="true" />
                    주문
                  </dt>
                  <dd>{(dashboard?.orderCount ?? 0).toLocaleString("ko-KR")}건</dd>
                </div>
                <div>
                  <dt>
                    <WalletCards aria-hidden="true" />
                    결제 완료
                  </dt>
                  <dd>{paymentCount.toLocaleString("ko-KR")}건</dd>
                </div>
                <div>
                  <dt>
                    <Users aria-hidden="true" />
                    방문 고객
                  </dt>
                  <dd>{(dashboard?.visitCount ?? 0).toLocaleString("ko-KR")}명</dd>
                </div>
                <div>
                  <dt>
                    <Package aria-hidden="true" />
                    판매 상품
                  </dt>
                  <dd>{(dashboard?.productCount ?? 0).toLocaleString("ko-KR")}개</dd>
                </div>
              </dl>
            </section>

            <section className="sales-operations" aria-label="실시간 운영 현황">
              <div className="sales-operation-list">
                <div className="sales-section-heading">
                  <div>
                    <span>{pendingOrders.length}건 처리 대기</span>
                    <h2>완료 처리할 주문</h2>
                    <p>상품을 전달한 뒤 바로 완료해 주세요.</p>
                  </div>
                  <button onClick={() => setActiveView("orders")} type="button">
                    전체 주문 보기
                  </button>
                </div>
                <div className="sales-order-rows">
                  <div className="sales-order-labels" aria-hidden="true">
                    <span>주문 상품</span>
                    <span>대기 시간</span>
                    <span>처리</span>
                  </div>
                  {visiblePendingOrders.map((order) => (
                    <article key={order.id}>
                      <span className="sales-order-icon" data-tone={order.tone}>
                        {order.tone === "ready" ? <CheckCircle2 /> : <ReceiptText />}
                      </span>
                      <div>
                        <strong>{order.item}</strong>
                        <span>
                          {order.id} · {order.name}
                        </span>
                      </div>
                      <time>
                        <Clock3 aria-hidden="true" />
                        {order.time}
                      </time>
                      <button
                        onClick={() => {
                          void (async () => {
                            if (onUpdateOrderStatus) {
                              await onUpdateOrderStatus(order.id, "completed");
                            }
                            setCompletedOrderIds((ids) => [...ids, order.id]);
                            setLastCompletedOrderId(order.id);
                          })();
                        }}
                        type="button"
                      >
                        픽업 완료
                      </button>
                    </article>
                  ))}
                  {visiblePendingOrders.length === 0 ? (
                    <div className="sales-orders-complete">
                      {searchQuery ? (
                        <Search aria-hidden="true" />
                      ) : (
                        <CheckCircle2 aria-hidden="true" />
                      )}
                      <strong>{searchQuery ? "검색 결과가 없어요" : "처리할 주문이 없어요"}</strong>
                      <span>
                        {searchQuery
                          ? "주문번호나 고객명을 다시 확인해 주세요."
                          : "새 주문이 들어오면 바로 알려드릴게요."}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <aside className="sales-stock-list">
                <div className="sales-section-heading">
                  <div>
                    <span>재고</span>
                    <h2>곧 품절될 상품</h2>
                    <p>현장 판매 전 수량을 확인하세요.</p>
                  </div>
                </div>
                <div>
                  {lowStockProducts.map((item) => {
                    const stock = currentProductStocks[item.id] ?? item.stock;
                    const tone = stock < 5 ? "danger" : "warning";
                    return (
                      <article key={item.id}>
                        <span data-tone={tone}>
                          <AlertTriangle />
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>남은 수량</small>
                        </div>
                        <b>{stock}개</b>
                      </article>
                    );
                  })}
                  {lowStockProducts.length === 0 ? (
                    <p className="sales-empty-row">재고 경고가 없습니다.</p>
                  ) : null}
                </div>
              </aside>
            </section>

            <section className="sales-day-payments" aria-labelledby="sales-payments-title">
              <div className="sales-data-tabs" role="group" aria-label="거래 내역 구분">
                <button
                  aria-pressed={paymentView === "all"}
                  onClick={() => setPaymentView("all")}
                  type="button"
                >
                  결제 내역
                </button>
                <button
                  aria-pressed={paymentView === "captured"}
                  onClick={() => setPaymentView("captured")}
                  type="button"
                >
                  결제 완료
                </button>
                <button
                  aria-pressed={paymentView === "refunded"}
                  onClick={() => setPaymentView("refunded")}
                  type="button"
                >
                  환불 내역
                </button>
              </div>
              <div className="sales-section-heading sales-section-heading--row">
                <div>
                  <span>결제</span>
                  <h2 id="sales-payments-title">최근 결제</h2>
                  <p>오늘 들어온 결제 내역 {visiblePayments.length}건이에요.</p>
                </div>
                <button type="button">전체 내역 보기</button>
              </div>
              <div className="sales-payment-list">
                <div className="sales-payment-labels" aria-hidden="true">
                  <span>상품·주문자</span>
                  <span>결제 시각</span>
                  <span>상태</span>
                  <span>금액</span>
                </div>
                {visiblePayments.map((payment, index) => {
                  const refunded = payment.status === "refunded";
                  return (
                    <article key={payment.id ?? index}>
                      <span className="sales-payment-icon">
                        <WalletCards aria-hidden="true" />
                      </span>
                      <div>
                        <strong>{payment.productName ?? "현장 주문"}</strong>
                        <span>
                          {payment.customerName ?? "고객"} · {payment.id ?? `PAY-${index + 1}`}
                        </span>
                      </div>
                      <time>{formatPaymentTime(payment.createdAt ?? payment.occurredAt)}</time>
                      <span
                        className="sales-payment-status"
                        data-refunded={refunded ? "true" : undefined}
                      >
                        {refunded ? "환불" : "결제 완료"}
                      </span>
                      <strong>{formatAmount(payment.totalAmount ?? payment.amount)}</strong>
                    </article>
                  );
                })}
                {visiblePayments.length === 0 ? (
                  <p className="sales-empty-row">
                    {searchQuery ? "검색 결과가 없습니다." : "해당 상태의 결제 내역이 없습니다."}
                  </p>
                ) : null}
              </div>
            </section>
          </>
        ) : null}

        {activeView === "orders" ? (
          <section className="sales-workspace" aria-labelledby="orders-title">
            <header className="sales-workspace__header">
              <div>
                <span>실시간 주문</span>
                <h1 id="orders-title">주문을 빠르게 완료하세요</h1>
                <p>오래 기다린 주문부터 위에 표시돼요.</p>
              </div>
              <strong>{pendingOrders.length}건 대기 중</strong>
            </header>

            <div className="sales-order-toolbar">
              <div className="sales-filter-bar" role="group" aria-label="주문 상태 필터">
                <button
                  aria-pressed={orderView === "pending"}
                  onClick={() => setOrderView("pending")}
                  type="button"
                >
                  처리 대기 {pendingOrders.length}
                </button>
                <button
                  aria-pressed={orderView === "completed"}
                  onClick={() => setOrderView("completed")}
                  type="button"
                >
                  완료 {completedOrderCount}
                </button>
                <button
                  aria-pressed={orderView === "all"}
                  onClick={() => setOrderView("all")}
                  type="button"
                >
                  전체 {orders.length}
                </button>
              </div>
              <button
                className="sales-sort-button"
                onClick={() => setOrderSort((sort) => (sort === "oldest" ? "newest" : "oldest"))}
                type="button"
              >
                <ArrowUpDown aria-hidden="true" />
                {orderSort === "oldest" ? "오래된 주문순" : "최신 주문순"}
              </button>
            </div>

            <div className="sales-kds-board">
              {sortedVisibleOrders.map((order) => {
                const completed = order.completed || completedOrderIds.includes(order.id);
                const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
                return (
                  <article
                    className="sales-kds-card"
                    data-completed={completed || undefined}
                    data-tone={order.tone}
                    key={order.id}
                  >
                    <header>
                      <span className="sales-kds-channel">현장</span>
                      <strong>{order.id}</strong>
                      <time>
                        <Clock3 aria-hidden="true" />
                        {order.time}
                      </time>
                    </header>
                    <div className="sales-kds-customer">
                      <span>주문자</span>
                      <strong>{order.name}</strong>
                    </div>
                    <div className="sales-kds-items">
                      {order.items.map((item) => (
                        <div key={item.name}>
                          <b>{item.quantity}</b>
                          <span>
                            <strong>{item.name}</strong>
                            {item.options.map((option) => (
                              <small key={option}>└ {option}</small>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <footer>
                      <span
                        className="sales-order-state"
                        data-completed={completed || undefined}
                        data-urgent={!completed && order.tone === "urgent"}
                      >
                        {completed
                          ? "픽업 완료"
                          : order.tone === "urgent"
                            ? "우선 처리"
                            : "준비 완료"}
                      </span>
                      {completed ? (
                        <button disabled type="button">
                          {itemCount}개 · 처리 완료
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            void (async () => {
                              if (onUpdateOrderStatus) {
                                await onUpdateOrderStatus(order.id, "completed");
                              }
                              setCompletedOrderIds((ids) => [...ids, order.id]);
                              setLastCompletedOrderId(order.id);
                            })();
                          }}
                          type="button"
                        >
                          {itemCount}개 · 픽업 완료
                        </button>
                      )}
                    </footer>
                  </article>
                );
              })}
              {sortedVisibleOrders.length === 0 ? (
                <div className="sales-orders-complete">
                  {searchQuery ? (
                    <Search aria-hidden="true" />
                  ) : (
                    <CheckCircle2 aria-hidden="true" />
                  )}
                  <strong>
                    {searchQuery
                      ? "검색 결과가 없어요"
                      : orderView === "completed"
                        ? "완료된 주문이 없어요"
                        : "모든 주문을 처리했어요"}
                  </strong>
                  <span>
                    {searchQuery
                      ? "주문번호나 고객명을 다시 확인해 주세요."
                      : "새 주문이 들어오면 이곳에 표시됩니다."}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeView === "payment" ? (
          <section className="sales-workspace" aria-labelledby="payment-title">
            <header className="sales-workspace__header">
              <div>
                <span>대마페이</span>
                <h1 id="payment-title">{isPaymentOnlyMode ? "모바일 POS 결제" : "고객 바코드로 결제 받기"}</h1>
                <p>
                  {isPaymentOnlyMode
                    ? "상품을 고르고, 고객 바코드를 스캔한 뒤 승인하세요."
                    : "등록된 상품을 선택하고 고객 바코드를 스캔한 뒤 결제를 승인하세요."}
                </p>
              </div>
              <strong>{isPaymentOnlyMode ? boothName : formatAmount(revenue)}</strong>
            </header>

            {isPaymentOnlyMode ? (
              <div className="sales-pos-display" aria-label="결제 금액 표시">
                <span>{selectedPayProduct?.name ?? "상품 대기"}</span>
                <strong>{formatAmount(payTotalAmount)}</strong>
                <small>
                  {selectedPayProduct
                    ? `${payQuantity}개 · ${formatBarcodeOwner(payBarcode)}`
                    : "상품을 선택하면 결제 금액이 표시됩니다."}
                </small>
              </div>
            ) : null}

            {isPaymentOnlyMode ? (
              <div className="sales-payment-stepper" role="tablist" aria-label="결제 단계">
                {paymentStepLabels.map((label, index) => (
                  <button
                    aria-current={paymentStep === index ? "step" : undefined}
                    disabled={
                      (index === 1 && !selectedPayProduct) ||
                      (index === 2 && (!selectedPayProduct || !payBarcode))
                    }
                    key={label}
                    onClick={() => {
                      if (index === 1 && !selectedPayProduct) return;
                      if (index === 2 && (!selectedPayProduct || !payBarcode)) return;
                      setPaymentStep(index);
                    }}
                    type="button"
                  >
                    <span>{index + 1}</span>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="sales-barcode-payment" data-step={isPaymentOnlyMode ? paymentStep : undefined}>
              <section className="sales-barcode-payment__panel" aria-label="결제 상품 선택">
                <div className="sales-section-heading">
                  <div>
                    <span>1단계</span>
                    <h2>상품 선택</h2>
                    <p>등록된 상품 가격으로 결제 금액이 자동 계산됩니다.</p>
                  </div>
                </div>
                {products.length > 0 ? (
                  <div className="sales-payment-products">
                    {products.map((product) => {
                      const stock = currentProductStocks[product.id] ?? product.stock;
                      const selected = selectedPayProductId === product.id;
                      const disabled = stock <= 0;
                      return (
                        <button
                          aria-pressed={selected}
                          className="sales-payment-product"
                          data-selected={selected ? "true" : undefined}
                          disabled={disabled}
                          key={product.id}
                          onClick={() => {
                            setSelectedPayProductId(product.id);
                            setPayQuantity(1);
                            setPayError("");
                            setPayStatusMessage("");
                          }}
                          type="button"
                        >
                          {product.imageUrl ? (
                            <img alt="" src={product.imageUrl} />
                          ) : (
                            <span className="sales-payment-product__fallback">
                              <Package aria-hidden="true" />
                            </span>
                          )}
                          <span>
                            <strong>{product.name}</strong>
                            <small>
                              {formatAmount(product.price)} · 재고 {stock.toLocaleString("ko-KR")}개
                            </small>
                          </span>
                          {selected ? <CheckCircle2 aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="sales-payment-empty">
                    <Package aria-hidden="true" />
                    <strong>등록된 상품이 없습니다.</strong>
                    {isPaymentOnlyMode ? (
                      <span>전체 셀러 앱에서 상품을 먼저 등록하세요.</span>
                    ) : (
                      <button onClick={() => setActiveView("product-new")} type="button">
                        상품 등록
                      </button>
                    )}
                  </div>
                )}
                {isPaymentOnlyMode ? (
                  <div className="sales-payment-slide-actions">
                    <button
                      disabled={!selectedPayProduct}
                      onClick={() => setPaymentStep(1)}
                      type="button"
                    >
                      다음
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="sales-barcode-payment__panel" aria-label="바코드 조회">
                <div className="sales-section-heading">
                  <div>
                    <span>2단계</span>
                    <h2>바코드 확인</h2>
                    <p>카메라로 스캔하거나 스캐너 입력을 그대로 붙여넣을 수 있어요.</p>
                  </div>
                </div>
                <div className="sales-payment-scanner">
                  <div className="sales-payment-scanner__viewport" data-active={isPayScannerActive ? "true" : undefined}>
                    <div id={payScannerElementId} />
                    {!isPayScannerActive && !isStartingPayScanner ? (
                      <div className="sales-payment-scanner__placeholder">
                        <Camera aria-hidden="true" />
                        <strong>카메라 스캔 대기</strong>
                        <span>고객 결제 QR 또는 바코드를 화면 중앙에 맞추세요.</span>
                      </div>
                    ) : null}
                  </div>
                  {payScannerError ? (
                    <p className="sales-payment-message" data-error="true">
                      {payScannerError}
                    </p>
                  ) : null}
                  <div className="sales-payment-scanner__actions">
                    <button
                      className="sales-payment-primary"
                      disabled={isStartingPayScanner || isPayScannerActive}
                      onClick={startPayCameraScanner}
                      type="button"
                    >
                      <Camera aria-hidden="true" />
                      {isStartingPayScanner ? "카메라 여는 중" : "카메라 스캔"}
                    </button>
                    <button
                      className="sales-payment-secondary"
                      disabled={!isPayScannerActive && !isStartingPayScanner}
                      onClick={stopPayCameraScanner}
                      type="button"
                    >
                      <X aria-hidden="true" />
                      중지
                    </button>
                  </div>
                </div>
                <label className="sales-payment-field">
                  <span>바코드 번호</span>
                  <div>
                    <CreditCard aria-hidden="true" />
                    <input
                      autoComplete="off"
                      onChange={(event) => {
                        setPayCode(event.currentTarget.value);
                        setPayBarcode(undefined);
                        setPayStatusMessage("");
                        setPayError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          lookupPayBarcode();
                        }
                      }}
                      placeholder="DAEMA-PAY:..."
                      ref={payCodeInputRef}
                      value={payCode}
                    />
                  </div>
                </label>
                <button
                  className="sales-payment-primary"
                  disabled={isLookingUpPayBarcode}
                  onClick={() => lookupPayBarcode()}
                  type="button"
                >
                  {isLookingUpPayBarcode ? "조회 중" : "바코드 조회"}
                </button>

                <div className="sales-payment-customer" data-active={payBarcode ? "true" : undefined}>
                  <span>결제 고객</span>
                  <strong>{formatBarcodeOwner(payBarcode)}</strong>
                  <small>{payBarcode?.expiresAt ? `만료 ${formatPaymentTime(payBarcode.expiresAt)}` : "조회 후 결제 가능"}</small>
                </div>
                {isPaymentOnlyMode ? (
                  <div className="sales-payment-slide-actions">
                    <button className="sales-payment-secondary" onClick={() => setPaymentStep(0)} type="button">
                      이전
                    </button>
                    <button disabled={!payBarcode} onClick={() => setPaymentStep(2)} type="button">
                      다음
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="sales-barcode-payment__panel" aria-label="결제 승인">
                <div className="sales-section-heading">
                  <div>
                    <span>3단계</span>
                    <h2>결제 확인</h2>
                    <p>승인 즉시 고객 DMC가 차감되고 결제 내역에 기록됩니다.</p>
                  </div>
                </div>
                <div className="sales-payment-summary">
                  <div>
                    <span>선택 상품</span>
                    <strong>{selectedPayProduct?.name ?? "상품을 선택하세요"}</strong>
                    <small>
                      {selectedPayProduct
                        ? `${formatAmount(selectedPayProduct.price)} · 재고 ${selectedPayProductStock.toLocaleString("ko-KR")}개`
                        : "1단계에서 결제할 상품을 선택하세요."}
                    </small>
                  </div>
                  <div className="sales-payment-quantity">
                    <button
                      aria-label="수량 줄이기"
                      disabled={!selectedPayProduct || payQuantity <= 1}
                      onClick={() => setPayQuantity((quantity) => Math.max(1, quantity - 1))}
                      type="button"
                    >
                      <Minus aria-hidden="true" />
                    </button>
                    <span>{payQuantity}</span>
                    <button
                      aria-label="수량 늘리기"
                      disabled={!selectedPayProduct || payQuantity >= Math.max(1, selectedPayProductStock)}
                      onClick={() =>
                        setPayQuantity((quantity) =>
                          Math.min(Math.max(1, selectedPayProductStock), quantity + 1),
                        )
                      }
                      type="button"
                    >
                      <Plus aria-hidden="true" />
                    </button>
                  </div>
                  <dl>
                    <div>
                      <dt>결제 고객</dt>
                      <dd>{formatBarcodeOwner(payBarcode)}</dd>
                    </div>
                    <div>
                      <dt>총 결제 금액</dt>
                      <dd>{formatAmount(payTotalAmount)}</dd>
                    </div>
                  </dl>
                </div>
                {payError ? <p className="sales-payment-message" data-error="true">{payError}</p> : null}
                {payStatusMessage ? <p className="sales-payment-message">{payStatusMessage}</p> : null}
                <button
                  className="sales-payment-capture"
                  disabled={!payBarcode || !selectedPayProduct || isCapturingPayment}
                  onClick={captureBarcodePayment}
                  type="button"
                >
                  {isCapturingPayment ? "승인 중" : "결제 승인"}
                </button>
                {isPaymentOnlyMode ? (
                  <div className="sales-payment-slide-actions">
                    <button className="sales-payment-secondary" onClick={() => setPaymentStep(1)} type="button">
                      이전
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          </section>
        ) : null}

        {activeView === "inventory" ? (
          <section className="sales-workspace" aria-labelledby="inventory-title">
            <header className="sales-workspace__header">
              <div>
                <span>상품·재고</span>
                <h1 id="inventory-title">판매 상품을 관리하세요</h1>
                <p>축제 운영 중에는 재고 수량과 판매 상태만 빠르게 바꿀 수 있어요.</p>
              </div>
              <button
                className="sales-primary-action"
                onClick={() => setActiveView("product-new")}
                type="button"
              >
                <Plus />
                상품 추가
              </button>
            </header>

            <div className="sales-inventory-summary">
              <div>
                <Box />
                <span>
                  판매 중 상품<strong>{products.length}개</strong>
                </span>
              </div>
              <div>
                <AlertTriangle />
                <span>
                  재고 부족<strong>{lowStockProducts.length}개</strong>
                </span>
              </div>
              <div>
                <ShoppingBag />
                <span>
                  오늘 판매<strong>{todaySoldCount.toLocaleString("ko-KR")}개</strong>
                </span>
              </div>
            </div>

            <div className="sales-product-toolbar">
              <label>
                <Search />
                <input
                  aria-label="상품 검색"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="상품명 검색"
                  value={searchQuery}
                />
              </label>
              <button type="button">
                <Settings2 />
                진열 순서
              </button>
            </div>
            <div className="sales-product-table">
              <div className="sales-product-labels" aria-hidden="true">
                <span>상품</span>
                <span>판매가</span>
                <span>카테고리</span>
                <span>오늘 판매</span>
                <span>남은 재고</span>
                <span>상태</span>
                <span>관리</span>
              </div>
              {visibleProducts.map((product) => {
                const stock = currentProductStocks[product.id] ?? product.stock;
                return (
                  <article key={product.id}>
                    <span className="sales-product-thumb">
                      {product.imageUrl ? (
                        <img alt="" src={product.imageUrl} />
                      ) : (
                        <Package aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.id}</small>
                    </div>
                    <strong>
                      {product.price.toLocaleString("ko-KR")}원
                    </strong>
                    <select
                      aria-label={`${product.name} 카테고리`}
                      className="sales-category-select"
                      onChange={(event) => {
                        if (onUpdateProduct) {
                          void onUpdateProduct(product.id, { category: event.currentTarget.value });
                        }
                      }}
                      value={product.category}
                    >
                      {productCategoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <span>{product.sold}개</span>
                    <div className="sales-stock-stepper">
                      <button
                        aria-label={`${product.name} 재고 줄이기`}
                        onClick={() =>
                          setProductStocks((stocks) => ({
                            ...stocks,
                            [product.id]: Math.max(0, stock - 1),
                          }))
                        }
                        type="button"
                      >
                        <Minus />
                      </button>
                      <strong data-low={stock < 10}>{stock}</strong>
                      <button
                        aria-label={`${product.name} 재고 늘리기`}
                        onClick={() => {
                          setProductStocks((stocks) => ({ ...stocks, [product.id]: stock + 1 }));
                        }}
                        type="button"
                      >
                        <Plus />
                      </button>
                    </div>
                    <button
                      className="sales-sale-status"
                      data-paused={currentProductStatuses[product.id] === "판매 중지" || undefined}
                      onClick={() =>
                        setProductStatuses((statuses) => ({
                          ...statuses,
                          [product.id]:
                            currentProductStatuses[product.id] === "판매 중지"
                              ? "판매 중"
                              : "판매 중지",
                        }))
                      }
                      type="button"
                    >
                      {currentProductStatuses[product.id] ?? product.status}
                      <ChevronDown />
                    </button>
                    <button
                      aria-label={`${product.name} 삭제`}
                      className="sales-product-delete"
                      onClick={() => {
                        if (onDeleteProduct && window.confirm(`${product.name} 상품을 삭제할까요?`)) {
                          void onDeleteProduct(product.id);
                        }
                      }}
                      type="button"
                    >
                      <Trash2 />
                    </button>
                  </article>
                );
              })}
              {visibleProducts.length === 0 ? (
                <p className="sales-empty-row">검색 결과가 없습니다.</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeView === "product-new" ? (
          <section className="sales-product-create" aria-labelledby="product-create-title">
            <header>
              <button onClick={() => setActiveView("inventory")} type="button">
                상품·재고로 돌아가기
              </button>
              <h1 id="product-create-title">새 상품 등록</h1>
              <p>판매 화면에 표시할 상품 정보와 초기 재고를 입력하세요.</p>
            </header>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void (async () => {
                  const price = Number(newProduct.price);
                  const stock = Number(newProduct.stock);
                  const title = newProduct.name.trim();
                  if (!title || price < 0 || stock < 0 || isCreatingProduct) return;

                  if (!activeBoothId || !onCreateProduct) {
                    setProductCreateError("연결된 부스가 없어 상품을 등록할 수 없습니다.");
                    return;
                  }

                  setIsCreatingProduct(true);
                  setProductCreateError("");

                  try {
                    let imageUrl = "";
                    if (selectedProductImage && onUploadProductImage) {
                      const upload = await onUploadProductImage({
                        boothId: activeBoothId,
                        file: selectedProductImage,
                      });
                      imageUrl = upload.url ?? "";
                    }

                    const created = await onCreateProduct(activeBoothId, {
                      category: newProduct.category,
                      description: newProduct.description.trim(),
                      imageUrl,
                      price,
                      stock,
                      thumbnail: imageUrl,
                      title,
                    });
                    const id = created.id ?? created.productId ?? `PRD-${String(products.length + 1).padStart(2, "0")}`;

                    setProductStocks((stocks) => ({ ...stocks, [id]: stock }));
                    setProductStatuses((statuses) => ({ ...statuses, [id]: "판매 중" }));
                    selectProductImage(undefined);
                    setNewProduct({
                      category: "food",
                      description: "",
                      name: "",
                      price: "",
                      stock: "",
                    });
                    setActiveView("inventory");
                  } catch {
                    setProductCreateError("상품 이미지 업로드 또는 상품 등록을 완료하지 못했습니다.");
                  } finally {
                    setIsCreatingProduct(false);
                  }
                })();
              }}
            >
              <div className="sales-product-form">
                <section>
                  <h2>기본 정보</h2>
                  <p>고객과 판매자가 구분하기 쉬운 이름을 사용하세요.</p>
                  <label>
                    상품명
                    <input
                      onChange={(event) =>
                        setNewProduct((product) => ({ ...product, name: event.target.value }))
                      }
                      placeholder="예: 청포도 에이드"
                      required
                      value={newProduct.name}
                    />
                  </label>
                  <label>
                    카테고리
                    <select
                      onChange={(event) =>
                        setNewProduct((product) => ({ ...product, category: event.target.value }))
                      }
                      value={newProduct.category}
                    >
                      {productCategoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    상품 설명
                    <textarea
                      onChange={(event) =>
                        setNewProduct((product) => ({
                          ...product,
                          description: event.target.value,
                        }))
                      }
                      placeholder="상품의 특징이나 옵션을 입력하세요."
                      rows={4}
                      value={newProduct.description}
                    />
                  </label>
                  <div className="sales-image-upload">
                    <div className="sales-image-upload__preview">
                      {productImagePreviewUrl ? (
                        <img alt="선택한 상품 사진 미리보기" src={productImagePreviewUrl} />
                      ) : (
                        <ImageUp aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <strong>상품 사진</strong>
                      <p>JPG, PNG, WebP 이미지를 업로드하면 상품 목록에 썸네일로 표시됩니다.</p>
                      <label className="sales-image-upload__button">
                        <input
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            selectProductImage(file);
                          }}
                          type="file"
                        />
                        <ImageUp aria-hidden="true" />
                        사진 선택
                      </label>
                      {selectedProductImage ? (
                        <button
                          className="sales-image-upload__clear"
                          onClick={() => selectProductImage(undefined)}
                          type="button"
                        >
                          <X aria-hidden="true" />
                          선택 해제
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section>
                  <h2>가격과 재고</h2>
                  <p>축제 당일 판매 가격과 시작 재고를 입력하세요.</p>
                  <div className="sales-product-form__row">
                    <label>
                      판매 가격
                      <span>
                        <input
                          aria-label="판매 가격"
                          min="0"
                          onChange={(event) =>
                            setNewProduct((product) => ({ ...product, price: event.target.value }))
                          }
                          placeholder="0"
                          required
                          type="number"
                          value={newProduct.price}
                        />
                        원
                      </span>
                    </label>
                    <label>
                      초기 재고
                      <span>
                        <input
                          aria-label="초기 재고"
                          min="0"
                          onChange={(event) =>
                            setNewProduct((product) => ({ ...product, stock: event.target.value }))
                          }
                          placeholder="0"
                          required
                          type="number"
                          value={newProduct.stock}
                        />
                        개
                      </span>
                    </label>
                  </div>
                  <div className="sales-product-preview">
                    <span>
                      {productImagePreviewUrl ? (
                        <img alt="" src={productImagePreviewUrl} />
                      ) : (
                        <Package aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <small>{productCategoryLabel(newProduct.category)}</small>
                      <strong>{newProduct.name || "상품명이 표시됩니다"}</strong>
                      <p>
                        {newProduct.description ||
                          "상품 설명을 입력하면 이곳에서 확인할 수 있어요."}
                      </p>
                    </div>
                    <b>
                      {(Math.max(Number(newProduct.price) || 0, 0)).toLocaleString("ko-KR")}원
                    </b>
                  </div>
                </section>
              </div>

              <footer>
                {productCreateError ? (
                  <p className="sales-product-error" role="alert">
                    {productCreateError}
                  </p>
                ) : null}
                <button onClick={() => setActiveView("inventory")} type="button">
                  취소
                </button>
                <button disabled={isCreatingProduct} type="submit">
                  {isCreatingProduct ? "등록 중" : "상품 등록"}
                </button>
              </footer>
            </form>
          </section>
        ) : null}

        {activeView === "settlement" ? (
          <section className="sales-workspace" aria-labelledby="settlement-title">
            <header className="sales-workspace__header">
              <div>
                <span>정산</span>
                <h1 id="settlement-title">오늘 판매 대금을 확인하세요</h1>
                <p>축제 종료 후 등록된 계좌로 한 번에 정산돼요.</p>
              </div>
              <button className="sales-secondary-action" type="button">
                <ArrowDownToLine />
                정산 내역 받기
              </button>
            </header>

            <div className="sales-settlement-hero">
              <span>정산 예정 금액</span>
              <strong>{formatAmount(revenue)}</strong>
              <p>수수료 없이 결제 완료 금액 전액을 지급해요.</p>
              <dl>
                <div>
                  <dt>총 결제</dt>
                  <dd>{formatAmount(revenue)}</dd>
                </div>
                <div>
                  <dt>환불</dt>
                  <dd>-12,000 DMC</dd>
                </div>
                <div>
                  <dt>수수료</dt>
                  <dd>0 DMC</dd>
                </div>
              </dl>
            </div>

            <div className="sales-settlement-grid">
              <section>
                <div className="sales-section-heading">
                  <div>
                    <span>지급 일정</span>
                    <h2>7월 2일 오후 2시 예정</h2>
                    <p>정산 완료 시 알림을 보내드려요.</p>
                  </div>
                </div>
                <div className="sales-payout-account">
                  <CreditCard />
                  <div>
                    <span>입금 계좌</span>
                    <strong>정산 계좌 미등록</strong>
                    <small>관리자에게 정산 계좌 등록을 요청하세요.</small>
                  </div>
                  <button type="button">변경</button>
                </div>
              </section>
              <section>
                <div className="sales-section-heading">
                  <div>
                    <span>결제 구성</span>
                    <h2>오늘 결제 {paymentCount}건</h2>
                    <p>결제 수단별 매출이에요.</p>
                  </div>
                </div>
                <div className="sales-payment-breakdown">
                  <div>
                    <span>대마페이</span>
                    <strong>{formatAmount(revenue)}</strong>
                    <i style={{ width: paymentCount > 0 ? "100%" : "0%" }} />
                  </div>
                </div>
              </section>
            </div>
          </section>
        ) : null}

        <footer className="sales-footer">
          <span>{booths.length > 1 ? `${booths.length}개 부스 운영 중` : boothName}</span>
          <span>실시간으로 업데이트돼요</span>
        </footer>
      </main>

      {lastCompletedOrderId ? (
        <div aria-live="polite" className="sales-completion-toast" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>
            <strong>{lastCompletedOrderId}</strong> 픽업을 완료했어요
          </span>
          <button
            onClick={() => {
              setCompletedOrderIds((ids) => ids.filter((id) => id !== lastCompletedOrderId));
              setLastCompletedOrderId(null);
            }}
            type="button"
          >
            실행 취소
          </button>
        </div>
      ) : null}
    </div>
  );
}
