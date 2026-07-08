export type BoothCategoryId = "all" | "booth" | "rest" | "experience" | "food";

export type BoothCategory = {
  id: BoothCategoryId;
  label: string;
  title: string;
};

export type BoothProduct = {
  boothId?: string;
  categories: BoothCategoryId[];
  description: string;
  discountPercent?: number;
  id: string;
  imageBackground: string;
  imageSrc: string;
  meta: string;
  originalPriceDmc?: number;
  priceDmc: number;
  rating?: string;
  title: string;
};

export function salePercent(product: BoothProduct) {
  if (typeof product.discountPercent === "number" && product.discountPercent > 0) {
    return Math.round(product.discountPercent);
  }

  if (product.originalPriceDmc && product.originalPriceDmc > product.priceDmc) {
    return Math.round(((product.originalPriceDmc - product.priceDmc) / product.originalPriceDmc) * 100);
  }

  return 0;
}

export function getProductIdFromPathname(pathname: string) {
  const [, productId] = pathname.match(/^\/booth\/([^/]+)/) ?? [];

  return productId ? decodeURIComponent(productId) : undefined;
}

export function formatDmc(value: number) {
  return `${value.toLocaleString("ko-KR")} DMC`;
}
