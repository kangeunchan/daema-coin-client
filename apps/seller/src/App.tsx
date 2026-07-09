import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@daema/ui/badge";
import { Button } from "@daema/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@daema/ui/card";
import { Text } from "@daema/ui/text";

import {
  fetchSellerBooths,
  fetchSellerDashboard,
  fetchSellerMe,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSellerSalesReport,
  isSellerApiEnabled,
  captureSellerPaymentIntent,
  createSellerPaymentIntent,
  lookupSellerPayBarcode,
  loginSeller,
  logoutSeller,
  createSellerProduct,
  createSellerProductImage,
  deleteSellerProduct,
  SellerApiError,
  updateSellerOrderStatus,
  updateSellerProduct,
  uploadSellerFile,
} from "./api";
import type {
  SellerBooth,
  SellerDashboard,
  SellerMe,
  SellerOrder,
  SellerProduct,
  SellerSalesReport,
} from "./api";
import { SellerSalesDashboard } from "./SalesDashboard";

function errorMessage(error: unknown) {
  if (error instanceof SellerApiError) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
}

export function App() {
  const [session, setSession] = useState<SellerMe | undefined>();
  const [booths, setBooths] = useState<readonly SellerBooth[]>([]);
  const [dashboard, setDashboard] = useState<SellerDashboard | undefined>();
  const [salesReport, setSalesReport] = useState<SellerSalesReport | undefined>();
  const [products, setProducts] = useState<readonly SellerProduct[]>([]);
  const [orders, setOrders] = useState<readonly SellerOrder[]>([]);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(() => isSellerApiEnabled());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadSellerData = useCallback(async () => {
    const nextBooths = await fetchSellerBooths();
    setBooths(nextBooths);

    const firstBoothId = nextBooths[0]?.id;
    if (firstBoothId) {
      const [nextDashboard, nextSalesReport, nextProducts, nextOrders] = await Promise.all([
        fetchSellerDashboard(firstBoothId),
        fetchSellerSalesReport(firstBoothId).catch(() => undefined),
        fetchSellerProducts(firstBoothId).catch(() => []),
        fetchSellerOrders(firstBoothId).catch(() => []),
      ]);
      setDashboard(nextDashboard);
      setSalesReport(nextSalesReport);
      setProducts(nextProducts);
      setOrders(nextOrders);
    } else {
      setDashboard(undefined);
      setSalesReport(undefined);
      setProducts([]);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    if (!isSellerApiEnabled()) {
      return;
    }

    let isActive = true;

    void fetchSellerMe()
      .then((nextSession) => {
        if (!isActive) {
          return;
        }

        setSession(nextSession);
        return loadSellerData();
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) {
          setIsChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [loadSellerData]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadSellerData().catch(() => undefined);
    }, 2_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadSellerData, session]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    void loginSeller(loginId.trim(), password)
      .then(async (result) => {
        setSession(result.user);
        setPassword("");
        await loadSellerData();
      })
      .catch((nextError) => {
        setError(errorMessage(nextError));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (isChecking) {
    return (
      <main className="app">
        <section className="seller-panel" aria-label="부스 앱 확인 중">
          <Text color="muted">세션 확인 중</Text>
        </section>
      </main>
    );
  }

  if (!isSellerApiEnabled()) {
    return (
      <main className="app">
        <section className="seller-panel" aria-label="부스 API 설정 필요">
          <Badge intent="success">Booth</Badge>
          <h1>부스 API 설정 필요</h1>
          <p>VITE_SELLER_API_BASE_URL을 /api로 끝나는 백엔드 주소로 설정하세요.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app">
        <Card asChild className="seller-login" padding="lg">
          <form aria-label="부스 로그인" onSubmit={handleLogin}>
            <CardHeader>
              <Badge intent="success">Booth</Badge>
              <CardTitle>부스 계정 로그인</CardTitle>
              <CardDescription>관리자가 발급한 부스 계정으로 접속합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="seller-field">
                <span>계정 ID</span>
                <input
                  autoComplete="username"
                  onChange={(event) => {
                    setLoginId(event.currentTarget.value);
                  }}
                  required
                  value={loginId}
                />
              </label>
              <label className="seller-field">
                <span>비밀번호</span>
                <input
                  autoComplete="current-password"
                  minLength={10}
                  onChange={(event) => {
                    setPassword(event.currentTarget.value);
                  }}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error ? <p className="seller-error">{error}</p> : null}
              <Button className="seller-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? "확인 중" : "로그인"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    );
  }

  const activeBooth = booths[0];

  return (
    <SellerSalesDashboard
      booth={activeBooth}
      booths={booths}
      dashboard={dashboard}
      onCreateProduct={async (boothId, input) => {
        const created = await createSellerProduct(boothId, input);
        await loadSellerData();
        return created;
      }}
      onLogout={() => {
        void logoutSeller().finally(() => {
          setSession(undefined);
          setBooths([]);
          setDashboard(undefined);
          setSalesReport(undefined);
          setProducts([]);
          setOrders([]);
        });
      }}
      onUpdateOrderStatus={async (orderId, status) => {
        const updated = await updateSellerOrderStatus(orderId, status);
        await loadSellerData();
        return updated;
      }}
      onUpdateProduct={async (productId, input) => {
        const updated = await updateSellerProduct(productId, input);
        await loadSellerData();
        return updated;
      }}
      onDeleteProduct={async (productId) => {
        await deleteSellerProduct(productId);
        await loadSellerData();
      }}
      onLookupPayBarcode={lookupSellerPayBarcode}
      onCaptureBarcodePayment={async (input) => {
        const paymentInput: Parameters<typeof createSellerPaymentIntent>[0] = {
          amount: input.amount,
          barcode: input.code,
        };
        if (input.description) {
          paymentInput.description = input.description;
        }
        if (input.idempotencyKey) {
          paymentInput.idempotencyKey = input.idempotencyKey;
        }
        const intent = await createSellerPaymentIntent(paymentInput);
        const intentId = intent.id ?? intent.intentId;
        if (!intentId) {
          throw new SellerApiError("결제 intent ID를 받지 못했습니다.", 0);
        }
        const captureInput: Parameters<typeof captureSellerPaymentIntent>[1] = {};
        if (input.description) {
          captureInput.description = input.description;
          captureInput.productName = input.description;
        }
        const payment = await captureSellerPaymentIntent(intentId, captureInput);
        await loadSellerData();
        return payment;
      }}
      onUploadProductImage={async ({ boothId, file, productId }) => {
        const uploadInput: Parameters<typeof uploadSellerFile>[0] = {
          file,
          purpose: "seller-product-image",
        };
        if (boothId) {
          uploadInput.boothId = boothId;
        }
        if (productId) {
          uploadInput.productId = productId;
        }
        const upload = await uploadSellerFile(uploadInput);
        if (productId && upload.url) {
          const imageInput: Parameters<typeof createSellerProductImage>[1] = {
            imageUrl: upload.url,
          };
          if (upload.contentType) {
            imageInput.contentType = upload.contentType;
          }
          if (upload.filename) {
            imageInput.filename = upload.filename;
          }
          const uploadId = upload.id ?? upload.fileId;
          if (uploadId) {
            imageInput.uploadId = uploadId;
          }
          await createSellerProductImage(productId, imageInput);
        }
        return upload;
      }}
      orders={orders}
      report={salesReport}
      products={products}
      session={session}
    />
  );
}
