import { JsonApiError, requestJsonApi } from "@daema/shared";
import type { JsonApiRequestOptions } from "@daema/shared";

export class SellerApiError extends JsonApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, { code, name: "SellerApiError" });
  }
}

export type SellerMe = {
  boothId?: string;
  displayName?: string;
  id?: string;
  loginId?: string;
  roles?: string[];
};

export type SellerBooth = Record<string, unknown> & {
  id?: string;
  locationLabel?: string;
  name?: string;
  status?: string;
};

export type SellerDashboard = {
  orderCount?: number;
  paymentCount?: number;
  productCount?: number;
  visitCount?: number;
  revenue?: {
    currency?: string;
    formatted?: string;
    value?: number;
  };
};

export type SellerMoney = {
  currency?: string;
  formatted?: string;
  value?: number;
};

export type SellerPayment = Record<string, unknown> & {
  amount?: SellerMoney | number;
  createdAt?: string;
  customerName?: string;
  id?: string;
  method?: string;
  occurredAt?: string;
  productName?: string;
  status?: string;
  totalAmount?: SellerMoney | number;
};

export type SellerPayBarcode = Record<string, unknown> & {
  code?: string;
  customerId?: string;
  displayName?: string;
  expiresAt?: string;
  id?: string;
  lookupType?: string;
  name?: string;
  status?: string;
  studentNo?: string;
  userId?: string;
};

export type SellerPaymentIntent = Record<string, unknown> & {
  amount?: SellerMoney | number;
  id?: string;
  intentId?: string;
  paymentId?: string;
  status?: string;
};

export type SellerOrder = Record<string, unknown> & {
  createdAt?: string;
  customerName?: string;
  id?: string;
  item?: string;
  items?: unknown[];
  name?: string;
  orderId?: string;
  productName?: string;
  status?: string;
  title?: string;
  updatedAt?: string;
};

export type SellerOrderStatusUpdateInput = {
  notificationBody?: string;
  notificationTitle?: string;
};

export type SellerSalesReport = {
  boothId?: string;
  paymentCount?: number;
  payments?: SellerPayment[];
  totalAmount?: SellerMoney;
};

export type SellerUpload = Record<string, unknown> & {
  contentType?: string;
  fileId?: string;
  filename?: string;
  id?: string;
  provider?: string;
  size?: number;
  url?: string;
};

export type SellerProduct = Record<string, unknown> & {
  boothId?: string;
  category?: string;
  description?: string;
  id?: string;
  imageUrl?: string;
  name?: string;
  originalPrice?: SellerMoney | number;
  price?: SellerMoney | number;
  salePrice?: SellerMoney | number;
  productId?: string;
  sold?: number;
  status?: string;
  stock?: number;
  stockQuantity?: number;
  thumbnail?: string;
  title?: string;
};

export const sellerApiBaseUrl =
  import.meta.env.VITE_SELLER_API_BASE_URL?.replace(/\/$/, "") ??
  import.meta.env.VITE_DAEMA_API_BASE_URL?.replace(/\/$/, "") ??
  "";

export function isSellerApiEnabled() {
  if (import.meta.env.MODE === "test") {
    return true;
  }

  return sellerApiBaseUrl.length > 0;
}

async function sellerApiRequest<TResponse>(path: string, options: JsonApiRequestOptions = {}) {
  if (!sellerApiBaseUrl) {
    throw new SellerApiError("Seller API base URL is not configured.", 0);
  }

  return requestJsonApi<TResponse, SellerApiError>({
    baseUrl: sellerApiBaseUrl,
    createError: ({ code, message, status }) => new SellerApiError(message, status, code),
    defaultErrorMessage: "Seller API request failed.",
    options,
    path,
  });
}

async function sellerMultipartRequest<TResponse>(path: string, body: FormData) {
  if (!sellerApiBaseUrl) {
    throw new SellerApiError("Seller API base URL is not configured.", 0);
  }

  const response = await fetch(`${sellerApiBaseUrl}${path}`, {
    body,
    credentials: "include",
    method: "POST",
  });
  const payload = (await response.json().catch(() => undefined)) as
    | { data?: TResponse; error?: { code?: string; message?: string } }
    | undefined;

  if (!response.ok) {
    throw new SellerApiError(
      payload?.error?.message ?? response.statusText,
      response.status,
      payload?.error?.code,
    );
  }

  return payload?.data as TResponse;
}

export async function loginSeller(loginId: string, password: string) {
  return sellerApiRequest<{ user?: SellerMe }>("/auth/seller/login", {
    body: { loginId, password },
    method: "POST",
  });
}

export async function fetchSellerMe() {
  return sellerApiRequest<SellerMe>("/seller/me");
}

export async function logoutSeller() {
  return sellerApiRequest<{ loggedOut: boolean }>("/auth/seller/logout", { method: "POST" });
}

export async function fetchSellerBooths() {
  return sellerApiRequest<SellerBooth[]>("/seller/booths");
}

export async function fetchSellerDashboard(boothId: string) {
  return sellerApiRequest<SellerDashboard>(
    `/seller/booths/${encodeURIComponent(boothId)}/dashboard`,
  );
}

export async function fetchSellerSalesReport(boothId: string) {
  return sellerApiRequest<SellerSalesReport>(
    `/seller/booths/${encodeURIComponent(boothId)}/reports/sales`,
  );
}

export async function fetchSellerProducts(boothId: string) {
  return sellerApiRequest<SellerProduct[]>(
    `/seller/booths/${encodeURIComponent(boothId)}/products?limit=1000`,
  );
}

export async function fetchSellerOrders(boothId: string) {
  return sellerApiRequest<SellerOrder[]>(`/seller/booths/${encodeURIComponent(boothId)}/orders`);
}

export async function uploadSellerFile(input: {
  boothId?: string;
  file: File;
  productId?: string;
  purpose?: string;
}) {
  const body = new FormData();
  body.append("file", input.file);
  if (input.boothId) {
    body.append("boothId", input.boothId);
  }
  if (input.productId) {
    body.append("productId", input.productId);
  }
  if (input.purpose) {
    body.append("purpose", input.purpose);
  }
  return sellerMultipartRequest<SellerUpload>("/files/uploads", body);
}

export async function createSellerProduct(
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
) {
  return sellerApiRequest<SellerProduct>(`/seller/booths/${encodeURIComponent(boothId)}/products`, {
    body: input,
    method: "POST",
  });
}

export async function updateSellerProduct(
  productId: string,
  input: {
    category?: string;
    status?: string;
    stock?: number;
  },
) {
  return sellerApiRequest<SellerProduct>(`/seller/products/${encodeURIComponent(productId)}`, {
    body: input,
    method: "PATCH",
  });
}

export async function deleteSellerProduct(productId: string) {
  return sellerApiRequest<{ deleted?: boolean; productId?: string }>(
    `/seller/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
    },
  );
}

export async function updateSellerOrderStatus(
  orderId: string,
  status: string,
  input: SellerOrderStatusUpdateInput = {},
) {
  return sellerApiRequest<SellerOrder>(`/seller/orders/${encodeURIComponent(orderId)}/status`, {
    body: { ...input, status },
    method: "PATCH",
  });
}

export async function lookupSellerPayBarcode(code: string) {
  return sellerApiRequest<SellerPayBarcode>("/seller/pay/barcodes/lookup", {
    body: { code },
    method: "POST",
  });
}

export async function createSellerPaymentIntent(input: {
  amount: number;
  barcode: string;
  currency?: string;
  description?: string;
  idempotencyKey?: string;
}) {
  return sellerApiRequest<SellerPaymentIntent>("/seller/pay/payment-intents", {
    body: { currency: "DMC", ...input },
    method: "POST",
  });
}

export async function captureSellerPaymentIntent(
  intentId: string,
  input: { description?: string; productName?: string } = {},
) {
  return sellerApiRequest<SellerPayment>(
    `/seller/pay/payment-intents/${encodeURIComponent(intentId)}/capture`,
    {
      body: input,
      method: "POST",
    },
  );
}

export async function createSellerProductImage(
  productId: string,
  input: {
    contentType?: string;
    filename?: string;
    imageUrl: string;
    uploadId?: string;
  },
) {
  return sellerApiRequest<SellerUpload>(
    `/seller/products/${encodeURIComponent(productId)}/images`,
    {
      body: input,
      method: "POST",
    },
  );
}
