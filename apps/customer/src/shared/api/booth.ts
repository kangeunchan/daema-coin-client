import { customerApiRequest } from "./client";
import type { CustomerLedgerAmountDto } from "./ledger";

export type CustomerBoothCategoryDto = Record<string, unknown> & {
  categoryId?: string;
  id?: string;
  label?: string;
  name?: string;
  title?: string;
};

export type CustomerBoothBannerDto = Record<string, unknown> & {
  background?: string;
  badge?: string;
  imageSrc?: string;
  imageUrl?: string;
  muted?: string;
  note?: string;
  subtitle?: string;
  title?: string;
  tone?: string;
  value?: string;
};

export type CustomerBoothDto = Record<string, unknown> & {
  displayName?: string;
  id?: string;
  name?: string;
  title?: string;
};

export type CustomerBoothProductDto = Record<string, unknown> & {
  boothId?: string;
  boothName?: string;
  categories?: string[];
  category?: string;
  categoryId?: string;
  description?: string;
  displayName?: string;
  id?: string;
  imageBackground?: string;
  imageSrc?: string;
  imageUrl?: string;
  meta?: string;
  name?: string;
  price?: CustomerLedgerAmountDto | number;
  priceDmc?: number;
  productId?: string;
  rating?: string;
  salePrice?: CustomerLedgerAmountDto | number;
  status?: string;
  thumbnail?: string;
  title?: string;
  viewCount?: number;
  view_count?: number;
};

export type CustomerBoothHomeDto = {
  banners?: CustomerBoothBannerDto[];
  booths?: CustomerBoothDto[];
  categories?: CustomerBoothCategoryDto[];
  products?: CustomerBoothProductDto[];
};

export type CustomerBoothOrderDto = Record<string, unknown> & {
  amount?: CustomerLedgerAmountDto | number;
  createdAt?: string;
  customerName?: string;
  id?: string;
  item?: string;
  items?: unknown[];
  orderId?: string;
  productName?: string;
  productId?: string;
  quantity?: number;
  status?: string;
  totalAmount?: CustomerLedgerAmountDto | number;
};

export type CustomerCartItemDto = Record<string, unknown> & {
  id?: string;
  cartItemId?: string;
  imageSrc?: string;
  imageUrl?: string;
  name?: string;
  price?: CustomerLedgerAmountDto | number;
  productId?: string;
  quantity?: number;
  thumbnail?: string;
  title?: string;
  unitAmount?: CustomerLedgerAmountDto | number;
};

export type CustomerFavoriteDto = Record<string, unknown> & {
  id?: string;
  favoriteId?: string;
  targetId?: string;
  targetType?: string;
};

export async function fetchCustomerBoothHome() {
  return customerApiRequest<CustomerBoothHomeDto>("/customer/booth/home");
}

export async function createCustomerBoothOrder(input: { productId: string; quantity: number }) {
  return customerApiRequest<CustomerBoothOrderDto>("/customer/orders", {
    body: input,
    method: "POST",
  });
}

export async function fetchCustomerBoothOrders() {
  return customerApiRequest<CustomerBoothOrderDto[]>("/customer/orders");
}

export async function fetchCustomerCart() {
  return customerApiRequest<CustomerCartItemDto[]>("/customer/cart");
}

export async function createCustomerCartItem(input: { productId: string; quantity: number }) {
  return customerApiRequest<CustomerCartItemDto>("/customer/cart/items", {
    body: input,
    method: "POST",
  });
}

export async function fetchCustomerFavorites(targetId?: string) {
  const query = targetId ? `?targetId=${encodeURIComponent(targetId)}` : "";
  return customerApiRequest<CustomerFavoriteDto[]>(`/customer/favorites${query}`);
}

export async function createCustomerFavorite(input: { targetId: string; targetType?: string }) {
  return customerApiRequest<CustomerFavoriteDto>("/customer/favorites", {
    body: input,
    method: "POST",
  });
}

export async function deleteCustomerFavorite(targetId: string) {
  return customerApiRequest<{ deleted?: boolean; targetId?: string }>(
    `/customer/favorites/${encodeURIComponent(targetId)}`,
    {
      method: "DELETE",
    },
  );
}

export async function createCustomerBoothProductView(productId: string) {
  return customerApiRequest<CustomerBoothProductDto>(
    `/customer/booth/products/${encodeURIComponent(productId)}/view`,
    {
      body: {},
      method: "POST",
    },
  );
}
