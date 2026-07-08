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
  id: string;
  imageBackground: string;
  imageSrc: string;
  meta: string;
  priceDmc: number;
  rating?: string;
  title: string;
  viewCount?: number;
};

export function getProductIdFromPathname(pathname: string) {
  const [, productId] = pathname.match(/^\/booth\/([^/]+)/) ?? [];

  return productId ? decodeURIComponent(productId) : undefined;
}

export function formatDmc(value: number) {
  return `${value.toLocaleString("ko-KR")} DMC`;
}
