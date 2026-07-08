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
  id?: string;
  name?: string;
};

export type CustomerBoothProductDto = Record<string, unknown> & {
  boothId?: string;
  categories?: string[];
  category?: string;
  categoryId?: string;
  description?: string;
  discountPercent?: number;
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
};

export type CustomerBoothHomeDto = {
  banners?: CustomerBoothBannerDto[];
  booths?: CustomerBoothDto[];
  categories?: CustomerBoothCategoryDto[];
  products?: CustomerBoothProductDto[];
};

export type CustomerBoothOrderDto = Record<string, unknown> & {
  id?: string;
  orderId?: string;
  productId?: string;
  status?: string;
  totalAmount?: CustomerLedgerAmountDto | number;
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
