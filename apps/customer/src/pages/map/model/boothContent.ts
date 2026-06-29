export const boothCategories = [
  { id: "all", label: "쇼핑 홈", title: "강은찬님을 위한 추천 상품" },
  { id: "booth", label: "부스", title: "지금 둘러보기 좋은 부스" },
  { id: "rest", label: "휴식", title: "잠깐 쉬어가기 좋은 공간" },
  { id: "experience", label: "체험", title: "참여하면 좋은 체험 부스" },
  { id: "food", label: "먹거리", title: "지금 바로 먹기 좋은 먹거리" },
] as const;

export type BoothCategoryId = (typeof boothCategories)[number]["id"];

export const boothHeroSlides = [
  {
    badge: "10,000개 한정판매",
    background: "#fffbf5",
    imageSrc: "/booth/dogani-soup-cutout.png",
    note: "*하루 최대 1개 구매 가능",
    subtitle: "바른 도가니탕 500g 5팩",
    title: "도가니탕 100g",
    tone: "food",
    value: "356원",
  },
  {
    badge: "오늘만 현장특가",
    background: "#111827",
    imageSrc: "/3dicons/trophy.png",
    muted: "rgb(255 255 255 / 0.68)",
    note: "*부스 방문 인증 후 구매 가능",
    subtitle: "승부예측 참여권 패키지",
    title: "월드컵 응원 세트",
    value: "1,000P",
  },
  {
    badge: "대마페이 전용",
    background: "#ffe0bd",
    imageSrc: "/3dicons/coin.png",
    note: "*결제 시 자동 적립",
    subtitle: "축제 부스 결제 리워드",
    title: "부스 페이백",
    value: "최대 3%",
  },
] as const;

export const recommendedProducts = [
  {
    categories: ["booth", "experience"],
    description: "더운 야외 부스 이동 중에도 바로 쓸 수 있는 휴대용 선풍기입니다.",
    id: "portable-fan",
    imageBackground: "#e9edf4",
    imageSrc: "/booth/recommendations/portable-fan.png",
    meta: "14.7만 명",
    priceDmc: 2480,
    rating: "4.5 (2,447)",
    title: "휴대용 저소음 선풍기, 화이트, 1개",
  },
  {
    categories: ["booth"],
    description: "강의실, 체험존, 휴식 공간에서 노트북을 안정적으로 거치할 수 있는 세트입니다.",
    id: "laptop-stand",
    imageBackground: "#e9edf4",
    imageSrc: "/booth/recommendations/laptop.png",
    meta: "1,153 명",
    priceDmc: 6800,
    title: "강의용 노트북 스탠드 세트, 1개",
  },
  {
    categories: ["experience"],
    description:
      "행사 입장 확인과 체험 부스 체크인을 빠르게 처리할 수 있는 QR 확인용 단말기입니다.",
    id: "qr-terminal",
    imageBackground: "#e9edf4",
    imageSrc: "/booth/recommendations/smartphone.png",
    meta: "7,840 명",
    priceDmc: 4200,
    rating: "4.7 (821)",
    title: "행사 입장 QR 확인용 단말기, 1개",
  },
  {
    categories: ["rest"],
    description: "어두운 조명과 조용한 좌석으로 구성된 프리미엄 라운지 이용권입니다.",
    id: "premium-lounge",
    imageBackground: "#e9edf4",
    imageSrc: "/booth/recommendations/lounge.png",
    meta: "9,230 명",
    priceDmc: 3200,
    title: "프리미엄 휴식 라운지 이용권",
  },
  {
    categories: ["food", "booth"],
    description: "먹거리 부스에서 바로 교환할 수 있는 도가니탕 현장 교환권입니다.",
    id: "dogani-soup-ticket",
    imageBackground: "#e9edf4",
    imageSrc: "/booth/dogani-soup-cutout.png",
    meta: "3,406 명",
    priceDmc: 356,
    rating: "4.8 (533)",
    title: "도가니탕 100g 현장 교환권",
  },
] as const;

export type BoothProduct = (typeof recommendedProducts)[number];

export function getProductIdFromPathname(pathname: string) {
  const [, productId] = pathname.match(/^\/booth\/([^/]+)/) ?? [];

  return productId ? decodeURIComponent(productId) : undefined;
}

export function formatDmc(value: number) {
  return `${value.toLocaleString("ko-KR")} DMC`;
}
