# Daema API Requirements

작성일: 2026-06-24  
근거 코드: `apps/customer/src`, `apps/seller/src`, `apps/admin/src`

## 1. 현재 클라이언트 상태 요약

- `apps/customer`: 실제 퍼블리싱된 소비자용 모바일 웹앱. 홈, 페이, 부스, 포인트, 전체, 내역 화면이 구현되어 있고 데이터는 전부 프론트 하드코딩 상태다.
- `apps/seller`: 셀러 운영 화면 scaffold만 존재한다. UI 문구상 상품 관리, 정산 보기 확장이 예정되어 있다.
- `apps/admin`: 관리자 워크스페이스 scaffold만 존재한다. UI 문구상 대시보드, 권한 관리 확장이 예정되어 있다.
- 라우팅은 브라우저 히스토리 기반 SPA다. 주요 경로는 `/`, `/pay`, `/booth`, `/booth/:productId`, `/points`, `/points/worldcup`, `/points/worldcup/:matchId`, `/history`, `/all`이다.

## 2. API 설계 원칙

### 2.1 앱 분리

- 소비자 앱 API: `/api/customer/*`
- 부스 운영자 API: `/api/seller/*`
- 전체 관리자 API: `/api/admin/*`
- 공통 인증/파일/검색 API: `/api/auth/*`, `/api/files/*`, `/api/search/*`

### 2.2 공통 응답 형태

```ts
type ApiResponse<T> = {
  data: T;
  meta?: {
    requestId: string;
    serverTime: string;
    pagination?: Pagination;
  };
};

type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    serverTime: string;
  };
};

type Pagination = {
  cursor?: string;
  nextCursor?: string;
  limit: number;
  hasMore: boolean;
};
```

### 2.3 공통 도메인 타입

```ts
type CurrencyCode = "DMC" | "POINT" | "KRW";

type Amount = {
  currency: CurrencyCode;
  value: number;
  formatted: string;
};

type MediaAsset = {
  id: string;
  url: string;
  alt?: string;
  dominantColor?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
};

type IconKey =
  | "home"
  | "credit-card"
  | "storefront"
  | "circle-stack"
  | "grid"
  | "wallet"
  | "trophy"
  | "music"
  | "gift"
  | "bell"
  | "search"
  | "cart"
  | "bolt"
  | "close"
  | "back"
  | "calendar"
  | "chevron-right"
  | "chevron-left"
  | "share"
  | "heart"
  | "chat"
  | "eye"
  | "sparkles"
  | "ticket"
  | "football"
  | "check-circle";

type ActionLink = {
  type: "route" | "external" | "modal" | "api-action";
  label: string;
  href?: string;
  actionId?: string;
};
```

## 3. 소비자 앱 UI 인벤토리와 필요 API

### 3.1 공통 셸

대상 파일:

- `apps/customer/src/app/App.tsx`
- `apps/customer/src/app/ui/CustomerAppShell.tsx`
- `apps/customer/src/widgets/app-header/AppHeader.tsx`
- `apps/customer/src/widgets/bottom-tabbar/BottomTabbar.tsx`

#### UI 요소

- 브랜드 로고 `daema.`
- 상단 검색 버튼 `MagnifyingGlassIcon`
- 상단 알림 버튼 `BellIcon`
- 부스 페이지 상단 장바구니 버튼 `ShoppingBagIcon`
- 하단 기본 탭: 홈, 페이, 부스, 포인트, 전체
- 포인트 화면 전용 하단 탭: 뒤로가기, 일일, 월드컵, 경기 상세명

#### 필요 API

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/customer/me` | 사용자 이름, 프로필, 권한, 표시명 조회 |
| `GET` | `/api/customer/navigation` | 하단 탭/전체 메뉴 노출 여부, feature flag 조회 |
| `GET` | `/api/customer/notifications/summary` | 알림 미확인 개수, 최신 알림 요약 |
| `GET` | `/api/customer/cart/summary` | 장바구니 개수, 결제 대기 금액 |
| `GET` | `/api/search/suggestions?q=` | 검색 자동완성 |
| `GET` | `/api/search?q=&scope=` | 전체/부스/혜택/내역 통합 검색 |

#### 구조 예시

```ts
type CustomerMe = {
  id: string;
  displayName: string;
  schoolName?: string;
  avatar?: MediaAsset;
  grade?: string;
  className?: string;
};

type NavigationItem = {
  id: "home" | "pay" | "booth" | "points" | "all";
  label: string;
  path: string;
  iconKey: IconKey;
  enabled: boolean;
  badgeCount?: number;
};
```

### 3.2 홈 화면

대상 파일:

- `apps/customer/src/pages/home/CustomerHomePage.tsx`
- `apps/customer/src/entities/customer-home/model/homeContent.ts`
- `apps/customer/src/widgets/notice-bar/NoticeBar.tsx`
- `apps/customer/src/widgets/wallet-overview/WalletOverview.tsx`
- `apps/customer/src/widgets/shortcut-grid/ShortcutGrid.tsx`
- `apps/customer/src/widgets/promo-banners/PromoBanners.tsx`
- `apps/customer/src/widgets/recent-transactions/RecentTransactions.tsx`
- `apps/customer/src/widgets/ranking-podium/RankingCard.tsx`

#### UI 요소와 API 매핑

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 공지 바 | `대마페이 포인트 적립 혜택이 업데이트됐어요` | `GET /api/customer/notices/highlight` |
| 지갑 슬라이드 | 대마코인, 대마포인트 | `GET /api/customer/wallet/balances` |
| 지갑 내역 버튼 | `/history` 이동 | `GET /api/customer/ledger/transactions` |
| 이자 혜택 CTA | `+이자 혜택 받기` | `GET /api/customer/benefits/interest`, `POST /api/customer/benefits/:id/claim` |
| 단축 버튼 8개 | 결제, 통합 내역, 매일모으기, 승부예측, 부스, 공연, 혜택, 전체 | `GET /api/customer/home/shortcuts` |
| 혜택 배너 | 코인, 트로피 이미지 | `GET /api/customer/promotions?placement=home` |
| 최근 내역 | 6개 거래 | `GET /api/customer/ledger/recent?limit=6` |
| 개인 랭킹 | 개인 대마포인트 랭킹 | `GET /api/customer/rankings?type=user&metric=point` |
| 축제 일정 배너 | 일정 알아보기 | `GET /api/customer/festival/banner` 또는 `GET /api/customer/schedules/highlight` |
| 부스 랭킹 | 부스 대마포인트 랭킹 | `GET /api/customer/rankings?type=booth&metric=point` |

#### 구조 예시

```ts
type HomeResponse = {
  notice: NoticeHighlight;
  wallet: WalletSummary;
  shortcuts: ShortcutItem[];
  promotions: PromotionBanner[];
  recentTransactions: LedgerTransaction[];
  rankings: {
    userPoint: RankingEntry[];
    boothPoint: RankingEntry[];
  };
  festivalBanner?: PromotionBanner;
};

type NoticeHighlight = {
  id: string;
  label: string;
  title: string;
  href: string;
  startsAt?: string;
  endsAt?: string;
};

type WalletSummary = {
  balances: WalletBalance[];
};

type WalletBalance = {
  assetId: "dmc" | "point";
  label: string;
  amount: Amount;
  detailHref: string;
  benefit?: {
    id: string;
    title: string;
    subtitle: string;
    iconKey: IconKey;
    href: string;
    claimable: boolean;
  };
};

type ShortcutItem = {
  id: string;
  label: string;
  iconKey: IconKey;
  tone: string;
  href: string;
  enabled: boolean;
};

type PromotionBanner = {
  id: string;
  placement: "home" | "pay" | "booth";
  kicker: string;
  title: string;
  image: MediaAsset;
  href: string;
  startsAt?: string;
  endsAt?: string;
  priority: number;
};

type RankingEntry = {
  rank: number;
  subjectId: string;
  name: string;
  score: number;
  scoreLabel: string;
  tone?: string;
  avatar?: MediaAsset;
  avatarUrl?: string;
};
```

### 3.3 페이 화면

대상 파일:

- `apps/customer/src/pages/pay/CustomerPayPage.tsx`

#### UI 요소와 API 매핑

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 바로 결제 카드 | 대마코인 12,480 | `GET /api/customer/wallet/balances` |
| 바코드 | `DAEMA-PAY:DMC:12480:USER-DEMO-0001` | `POST /api/customer/pay/barcodes` |
| 바코드 번호 | `8801 2480 0622 0001` | 바코드 응답 필드 |
| 닫기 버튼 `XMarkIcon` | 모달 닫기 | API 없음 |
| 결제 혜택 배너 | 첫 번째 promo | `GET /api/customer/promotions?placement=pay` |
| 최근 내역 | 결제/적립 내역 | `GET /api/customer/ledger/recent?scope=pay` |

#### 구조 예시

```ts
type PayBarcodeCreateRequest = {
  currency: "DMC";
  maxSpendAmount?: number;
  purpose: "offline-payment";
};

type PayBarcode = {
  id: string;
  encodedValue: string;
  displayValue: string;
  expiresAt: string;
  refreshAfterSeconds: number;
  currency: "DMC";
  balance: Amount;
  status: "active" | "used" | "expired" | "revoked";
};
```

필수 정책:

- 바코드는 짧은 TTL을 가져야 한다.
- 화면이 열린 상태에서는 만료 전에 자동 갱신이 필요하다.
- 운영자 POS/스캐너에서 바코드를 조회하고 결제 승인할 수 있어야 한다.

### 3.4 부스 쇼핑/상품/결제 화면

대상 파일:

- `apps/customer/src/pages/map/CustomerMapPage.tsx`

현재 화면명은 `map`이지만 실제 UI는 부스 카테고리, 추천 상품, 상품 상세, 장바구니, checkout, 결제 완료 흐름이다.

#### 목록 UI

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 카테고리 탭 | 쇼핑 홈, 부스, 휴식, 체험, 먹거리 | `GET /api/customer/booth/categories` |
| 히어로 슬라이드 | 한정판매, 현장특가, 페이백 | `GET /api/customer/booth/banners` |
| 추천 상품 masonry | 상품 이미지, 제목, 조회 수, 평점 | `GET /api/customer/booth/products?categoryId=&cursor=` |
| 상품 노출/조회 | `EyeIcon` 옆 `14.7만 명` | `POST /api/customer/analytics/impressions`, `POST /api/customer/booth/products/:id/view` |
| 상품 상세 이동 | `/booth/:productId` | `GET /api/customer/booth/products/:id` |

#### 상품 상세 UI

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 뒤로가기 `ArrowLeftIcon` | 목록 복귀 | API 없음 |
| 공유 `ShareIcon` | 공유하기 | `POST /api/customer/shares` 또는 Web Share용 링크 생성 |
| 검색 `MagnifyingGlassIcon` | 상품 검색 | `GET /api/customer/booth/products/search?q=` |
| 장바구니 `ShoppingBagIcon` | 장바구니 열기 | `GET /api/customer/cart` |
| 카테고리 태그 | 부스/체험 등 | 상품 상세 응답 |
| 할인율/원가/판매가 | 28%, DMC 금액 | 상품 상세 응답 |
| 조회 수 `EyeIcon` | 명 단위 메타 | 상품 상세 응답 |
| 평점 `★` | 4.5 등 | 상품 상세 응답 |
| 설명 | 상품 description | 상품 상세 응답 |
| 수량 input | 1-99 | 재고/구매 제한 API |
| 결제수단 | 대마페이 | 상품 상세/checkout preview |
| 수령방법 | 현장 부스 교환 | 상품 상세/booth pickup policy |
| 구매제한 | 하루 최대 1개 | 상품 상세/eligibility |
| 찜 `HeartIcon` | 찜하기 | `POST /api/customer/favorites`, `DELETE /api/customer/favorites/:targetId` |
| 문의 `ChatBubbleOvalLeftEllipsisIcon` | 문의하기 | `GET/POST /api/customer/inquiries` |
| 장바구니 버튼 | 장바구니 담기 | `POST /api/customer/cart/items` |
| 구매하기 버튼 | checkout 진입 | `POST /api/customer/orders/preview` |

#### Checkout UI

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 최종 확인 | 상품, 수량 | `POST /api/customer/orders/preview` |
| 상품금액/수량/결제수단/총 결제금액 | DMC 계산 | preview 응답 |
| 결제하기 | 결제 완료 처리 | `POST /api/customer/orders` 또는 `POST /api/customer/payments` |
| 완료 화면 check SVG | 결제 완료 | `GET /api/customer/orders/:orderId` |

#### 구조 예시

```ts
type BoothCategory = {
  id: string;
  label: string;
  title: string;
  sortOrder: number;
  enabled: boolean;
};

type BoothProduct = {
  id: string;
  boothId: string;
  title: string;
  description: string;
  categories: string[];
  images: MediaAsset[];
  thumbnail: MediaAsset;
  price: Amount;
  originalPrice?: Amount;
  discountRate?: number;
  rating?: {
    average: number;
    count: number;
    label: string;
  };
  viewCount: number;
  viewCountLabel: string;
  stock: {
    status: "in-stock" | "low-stock" | "sold-out";
    remaining?: number;
  };
  purchaseLimit?: {
    perUserPerDay?: number;
    perOrderMin: number;
    perOrderMax: number;
  };
  pickupPolicy: {
    method: "booth-pickup" | "mobile-voucher" | "instant-use";
    boothName: string;
    boothLocation?: BoothLocation;
    instruction: string;
  };
  paymentMethods: Array<"daema-pay">;
  badges?: string[];
  isFavorite: boolean;
};

type OrderPreviewRequest = {
  productId: string;
  quantity: number;
  paymentMethod: "daema-pay";
};

type OrderPreview = {
  product: Pick<BoothProduct, "id" | "title" | "thumbnail">;
  quantity: number;
  itemAmount: Amount;
  discountAmount?: Amount;
  totalAmount: Amount;
  paymentMethod: "daema-pay";
  balanceAfterPayment?: Amount;
  warnings?: string[];
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status:
    | "created"
    | "paid"
    | "accepted"
    | "preparing"
    | "ready-for-pickup"
    | "picked-up"
    | "canceled"
    | "refunded";
  productId: string;
  boothId: string;
  quantity: number;
  totalAmount: Amount;
  pickupVoucher?: {
    id: string;
    qrValue: string;
    expiresAt: string;
    redeemedAt?: string;
  };
  createdAt: string;
  paidAt?: string;
};
```

### 3.5 포인트: 일일 커밋

대상 파일:

- `apps/customer/src/pages/points/CustomerPointsPage.tsx`
- `apps/customer/src/pages/points/model/commitPoints.ts`
- `apps/customer/src/shared/api/commits.ts`

#### UI 요소와 API 매핑

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 연속 커밋 요약 | 현재 5일, 최고 11일 | `GET /api/customer/points/commit-reward-summary` |
| 다음 리워드 진행률 | 7일 5,000원 / 14일 15,000원 | reward summary의 milestones |
| 이번 주 기록 | 하루 10커밋 이상 달성 여부 | `GET /api/customer/points/commit-activity?from=&to=` |
| 누적 지급액 | 현재 0원 | reward summary의 totalRewardAmount |
| 최근 커밋 | 4개 내역 | `GET /api/customer/points/commit-transactions?limit=` |

#### 구조 예시

```ts
type CommitActivityDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  rewardedPoints?: number;
};

type CommitStat = {
  period: string;
  label: string;
  commitCount: number;
  rewardedPoints: number;
  current: boolean;
};

type CommitRewardSummary = {
  committedToday: boolean;
  currentStreakDays: number;
  dailyCommitGoal: 10;
  longestStreakDays: number;
  lastCommittedAt?: string;
  todayCommitCount: number;
  totalRewardAmount: number;
  milestones: Array<{
    days: 7 | 14;
    rewardAmount: 5000 | 15000;
    status: "locked" | "earned" | "paid";
    achievedAt?: string;
    paidAt?: string;
  }>;
};
```

하루 커밋 수가 10개 이상일 때만 해당 날짜를 연속 기록 1일로 인정한다. 리워드는 7일 달성 시 5,000원, 연속 기록을 유지해 14일 달성 시 15,000원을 각각 자동 지급한다. 서버는 날짜 경계에 `Asia/Seoul`을 사용하고, 같은 마일스톤이 중복 지급되지 않도록 지급 처리를 멱등하게 보장해야 한다.

### 3.6 포인트: 월드컵 승부예측

대상 파일:

- `apps/customer/src/pages/points/CustomerPointsPage.tsx`
- `apps/customer/src/widgets/bottom-tabbar/BottomTabbar.tsx`

#### 경기 목록 UI

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 날짜 탭 | 6.23 오늘, 6.25 목 등 | `GET /api/customer/worldcup/match-days` |
| 날짜 badge | 대한민국 | match day 응답 |
| 시간 그룹 | 03:00, 10:00 등 | match 응답 |
| 경기 카드 | 홈/원정, 국기, 점수, 상태, subtitle | `GET /api/customer/worldcup/matches` |
| 경기 상세 링크 | `/points/worldcup/:matchId` | `GET /api/customer/worldcup/matches/:matchId` |

#### 경기 상세 UI

| UI | 필요 API |
| --- | --- |
| 경기 제목, 날짜, 경기 시간, 구분 | `GET /api/customer/worldcup/matches/:matchId` |
| 승부예측 통계 | `GET /api/customer/worldcup/matches/:matchId/predictions/summary` |
| 경기 지표 16개 | `GET /api/customer/worldcup/matches/:matchId/stats` |
| 라인업, 감독, 포메이션 | `GET /api/customer/worldcup/matches/:matchId/lineups` |
| 선수 리스트 | lineups 응답 |
| 플로팅 예측 버튼 3개 | `POST /api/customer/worldcup/matches/:matchId/predictions` |

#### 구조 예시

```ts
type CountryCode = "AR" | "AT" | "DZ" | "FR" | "IQ" | "JO" | "KR" | "MX" | "NO" | "SN";

type WorldcupTeam = {
  id: string;
  countryCode: CountryCode;
  name: string;
};

type WorldcupMatch = {
  id: string;
  matchDayId: string;
  home: WorldcupTeam & { score?: number };
  away: WorldcupTeam & { score?: number };
  status: "scheduled" | "live" | "finished";
  statusLabel: "예정" | "진행중" | "종료";
  subtitle: string;
  startsAt?: string;
  displayTime?: string;
};

type WorldcupPredictionSummary = {
  matchId: string;
  homePercent: number;
  drawPercent: number;
  awayPercent: number;
  totalCount: number;
  totalStakeAmount: number;
  myPrediction?: "home" | "draw" | "away";
  myStakeAmount?: number;
  canPredict: boolean;
  canCancel?: boolean;
  closesAt?: string;
};

type WorldcupPredictionRequest = {
  pick: "home" | "draw" | "away";
  stakePoint?: number;
};

type WorldcupLineup = {
  teamId: string;
  coach: string;
  formation: string;
  players: WorldcupPlayer[];
};

type WorldcupPlayer = {
  id: string;
  name: string;
  number: number;
  position: "GK" | "DF" | "MF" | "FW";
  rating?: number;
  x?: number;
  y?: number;
};

type WorldcupMatchMetric = {
  key: string;
  label: string;
  home: number;
  away: number;
  homeDisplay?: string;
  awayDisplay?: string;
};
```

### 3.7 통합 내역 화면

대상 파일:

- `apps/customer/src/pages/history/CustomerHistoryPage.tsx`

#### UI 요소와 API 매핑

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 탭 | 달력, 거래 내역, 수입/소비 분석 | 단일 API 또는 각 탭 API |
| 월 이동 `ChevronLeftIcon`, `ChevronRightIcon` | 4월-7월 순환 | `GET /api/customer/ledger/calendar?month=YYYY-MM` |
| 달력 셀 | 일자별 지출/수입 | calendar 응답 |
| 거래 내역 | 적립/사용, 금액, 시간 | `GET /api/customer/ledger/transactions?month=&cursor=` |
| 분석 요약 | 지출/수입 총액 | `GET /api/customer/ledger/analysis?month=` |
| 소비 카테고리 | 부스 결제, 먹거리, 공연/이벤트, 휴식 라운지 | analysis 응답 |
| 수입 카테고리 | 커밋 리워드, 승부예측 보상, 페이백, 출석 리워드 | analysis 응답 |

#### 구조 예시

```ts
type LedgerTransaction = {
  id: string;
  occurredAt: string;
  relativeTimeLabel?: string;
  direction: "income" | "expense";
  type:
    | "booth-payment"
    | "commit-reward"
    | "prediction-reward"
    | "payback"
    | "attendance-reward"
    | "point-exchange"
    | "admin-adjustment";
  title: string;
  subtitle?: string;
  amount: Amount;
  counterparty?: {
    type: "booth" | "system" | "user";
    id: string;
    name: string;
  };
  orderId?: string;
};

type LedgerCalendarDay = {
  date: string;
  day: number;
  income?: Amount;
  expense?: Amount;
  active?: boolean;
};

type LedgerAnalysis = {
  month: string;
  incomeTotal: Amount;
  expenseTotal: Amount;
  expenseCategories: LedgerCategory[];
  incomeCategories: LedgerCategory[];
};

type LedgerCategory = {
  id: string;
  label: string;
  value: Amount;
  color: string;
};
```

### 3.8 전체 메뉴 화면

대상 파일:

- `apps/customer/src/pages/all/CustomerAllPage.tsx`

#### UI 요소와 API 매핑

| UI | 현재 값 | 필요 API |
| --- | --- | --- |
| 사용자 이름 | 강은찬 | `GET /api/customer/me` |
| 보조 링크 | 페이, 포인트 | navigation 응답 |
| 사용 중인 기능 목록 | 13개 feature item | `GET /api/customer/features` |

#### 구조 예시

```ts
type CustomerFeatureItem = {
  id: string;
  label: string;
  href: string;
  iconKey: IconKey;
  tone: string;
  enabled: boolean;
  group?: "pay" | "points" | "booth" | "benefits" | "festival";
};
```

## 4. 아이콘 단위 인벤토리

서버가 UI 구성을 내려줘야 하는 영역은 `iconKey`를 사용하고, 클라이언트는 icon registry로 실제 컴포넌트를 매핑한다.

| 아이콘 | 라이브러리 | 현재 위치 | 의미 | API 연결 |
| --- | --- | --- | --- | --- |
| `HomeIcon` | Heroicons solid | 하단 탭, 전체 메뉴 | 홈 | navigation/features |
| `CreditCardIcon` | Heroicons solid | 하단 탭, 홈 단축, 전체 메뉴 | 페이/바코드 결제 | navigation/features/pay |
| `BuildingStorefrontIcon` | Heroicons solid | 하단 탭, 홈 단축, 전체 메뉴 | 부스 | navigation/features/booth |
| `CircleStackIcon` | Heroicons solid | 하단 탭, 홈 단축, 지갑 혜택, 전체 메뉴 | 포인트/코인 | wallet/points/features |
| `Squares2X2Icon` | Heroicons solid | 하단 탭, 홈 단축 | 전체 | navigation |
| `WalletIcon` | Heroicons solid | 홈 단축, 전체 메뉴 | 통합 내역 | ledger |
| `TrophyIcon` | Heroicons solid | 홈 단축, 랭킹 1위, 전체 메뉴 | 랭킹/승부예측 | rankings/worldcup |
| `MusicalNoteIcon` | Heroicons solid | 홈 단축 | 공연 | festival schedules/events |
| `GiftIcon` | Heroicons solid | 홈 단축, 전체 메뉴 | 혜택 | benefits/promotions |
| `BellIcon` | Heroicons solid | 헤더 | 알림 | notifications |
| `MagnifyingGlassIcon` | Heroicons solid | 헤더, 상품 상세 | 검색 | search |
| `ShoppingBagIcon` | Heroicons solid | 헤더, 상품 상세, 전체 메뉴 | 장바구니/상품 | cart/products |
| `BoltIcon` | Heroicons solid | 페이 화면, 전체 메뉴 | 바로 결제 | pay barcode/payment |
| `XMarkIcon` | Heroicons solid | 페이 바코드 focus | 닫기 | API 없음 |
| `ArrowLeftIcon` | Heroicons solid | 포인트 탭바, 상품 상세, checkout | 뒤로가기 | API 없음 |
| `CalendarDaysIcon` | Heroicons solid | 포인트 탭바, 전체 메뉴 | 일일/경기 일정 | points/worldcup schedules |
| `ChevronRightIcon` | Heroicons solid | 지갑, 배너, 최근 내역 | 상세 이동 | 해당 target href |
| `ChevronLeftIcon` | Heroicons solid | 내역 월 이동 | 이전 달 | ledger calendar |
| `ShareIcon` | Heroicons solid | 상품 상세 | 공유 | share link |
| `HeartIcon` | Heroicons outline | 상품 상세 | 찜 | favorites |
| `ChatBubbleOvalLeftEllipsisIcon` | Heroicons outline | 상품 상세 | 문의 | inquiries/chat |
| `EyeIcon` | Heroicons outline | 상품 카드/상세 | 조회/인기 | product stats/analytics |
| `SparklesIcon` | Heroicons solid | 전체 메뉴 | 커밋 잔디/프리미엄 라운지 | points/features/booth product |
| `TicketIcon` | Heroicons solid | 전체 메뉴 | 행사 입장 QR 단말기 | voucher/check-in/product |
| `FaFutbol` | react-icons | 포인트 탭바, 경기 상세 탭바 | 월드컵 | worldcup |
| 국가 국기 `AR`, `AT`, `DZ`, `FR`, `IQ`, `JO`, `KR`, `MX`, `NO`, `SN` | country-flag-icons | 월드컵 목록/상세 | 팀 국가 | worldcup team countryCode |
| 바코드 | react-barcode | 페이 | 결제 코드 | pay barcode |
| check circle SVG | inline svg | 결제 완료 | 완료 상태 | order/payment status |
| `coin.png`, `trophy.png`, `festival-calendar.png` | public asset | 배너/혜택 | 프로모션 시각 요소 | promotions media |
| `dogani-soup`, `portable-fan`, `laptop`, `smartphone`, `lounge` | public asset | 부스 상품 | 상품 이미지 | booth product media |

## 5. 부스 현장 운영 API

소비자 앱은 이미 상품 결제, 현장 교환, QR 단말기, 부스 랭킹, 방문 인증, 페이백을 암시하고 있다. 따라서 부스 운영 API는 단순 상품 CRUD가 아니라 현장 POS, 주문 처리, 재고, 교환 검증, 정산까지 필요하다.

### 5.1 운영자 인증/권한

| Method | Path | 용도 |
| --- | --- | --- |
| `POST` | `/api/auth/seller/login` | 부스 운영자 로그인 |
| `POST` | `/api/auth/seller/logout` | 로그아웃 |
| `GET` | `/api/seller/me` | 운영자 프로필, 소속 부스, 권한 |
| `GET` | `/api/seller/booths/:boothId/staff` | 부스 스태프 목록 |
| `POST` | `/api/seller/booths/:boothId/staff` | 스태프 초대/등록 |
| `PATCH` | `/api/seller/booths/:boothId/staff/:staffId` | 역할 변경 |

역할 예시:

- `owner`: 부스 대표, 정산/설정 가능
- `manager`: 상품/주문/재고 관리 가능
- `cashier`: 결제/교환 처리 가능
- `viewer`: 조회만 가능

### 5.2 부스 프로필/운영 상태

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/seller/booths` | 내가 운영하는 부스 목록 |
| `GET` | `/api/seller/booths/:boothId` | 부스 상세 |
| `PATCH` | `/api/seller/booths/:boothId` | 부스명, 설명, 이미지, 위치 수정 |
| `PATCH` | `/api/seller/booths/:boothId/status` | 운영중/준비중/마감/품절 상태 변경 |
| `GET` | `/api/customer/booths/:boothId` | 소비자용 부스 상세 |

```ts
type Booth = {
  id: string;
  name: string;
  description: string;
  categoryIds: string[];
  status: "preparing" | "open" | "paused" | "closed";
  location: BoothLocation;
  images: MediaAsset[];
  openingHours: OpeningHour[];
  paymentMethods: Array<"daema-pay" | "cash" | "card">;
  pickupEnabled: boolean;
};

type BoothLocation = {
  building?: string;
  floor?: string;
  zone?: string;
  boothNumber?: string;
  latitude?: number;
  longitude?: number;
  mapImage?: MediaAsset;
};
```

### 5.3 상품/교환권/재고

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/seller/booths/:boothId/products` | 상품 목록 |
| `POST` | `/api/seller/booths/:boothId/products` | 상품 생성 |
| `GET` | `/api/seller/products/:productId` | 상품 상세 |
| `PATCH` | `/api/seller/products/:productId` | 상품 수정 |
| `PATCH` | `/api/seller/products/:productId/status` | 판매중/숨김/품절 변경 |
| `POST` | `/api/seller/products/:productId/images` | 상품 이미지 업로드/연결 |
| `GET` | `/api/seller/products/:productId/inventory` | 재고 조회 |
| `POST` | `/api/seller/products/:productId/inventory/adjustments` | 재고 입출고 조정 |
| `GET` | `/api/seller/products/:productId/purchase-limits` | 구매 제한 조회 |
| `PATCH` | `/api/seller/products/:productId/purchase-limits` | 1인/일별/회차별 제한 설정 |

```ts
type InventoryAdjustment = {
  type: "stock-in" | "stock-out" | "correction" | "waste" | "reserved-release";
  quantity: number;
  reason: string;
};
```

### 5.4 주문 큐/현장 수령

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/seller/booths/:boothId/orders?status=` | 주문 큐 조회 |
| `GET` | `/api/seller/orders/:orderId` | 주문 상세 |
| `PATCH` | `/api/seller/orders/:orderId/status` | 접수/준비중/수령가능/수령완료 변경 |
| `POST` | `/api/seller/orders/:orderId/cancel` | 주문 취소 |
| `POST` | `/api/seller/orders/:orderId/refund` | 환불 |
| `POST` | `/api/seller/pickup-vouchers/verify` | QR/바코드 교환권 검증 |
| `POST` | `/api/seller/pickup-vouchers/:voucherId/redeem` | 현장 수령 완료 처리 |

```ts
type SellerOrderStatus =
  | "paid"
  | "accepted"
  | "preparing"
  | "ready-for-pickup"
  | "picked-up"
  | "canceled"
  | "refunded";

type PickupVoucherVerification = {
  voucherId: string;
  orderId: string;
  productTitle: string;
  quantity: number;
  customerDisplayName: string;
  status: "valid" | "already-redeemed" | "expired" | "invalid";
  redeemedAt?: string;
};
```

### 5.5 현장 POS/대마페이 결제

소비자 페이 화면의 바코드는 운영자가 스캔해야 완성된다.

| Method | Path | 용도 |
| --- | --- | --- |
| `POST` | `/api/seller/pay/barcodes/lookup` | 소비자 바코드 조회 |
| `POST` | `/api/seller/pay/payment-intents` | 현장 결제 요청 생성 |
| `POST` | `/api/seller/pay/payment-intents/:intentId/capture` | 결제 승인 |
| `POST` | `/api/seller/pay/payment-intents/:intentId/cancel` | 결제 취소 |
| `POST` | `/api/seller/pay/payments/:paymentId/refund` | 결제 환불 |
| `GET` | `/api/seller/booths/:boothId/payments` | 결제 내역 |

```ts
type SellerPaymentIntentRequest = {
  boothId: string;
  barcodeValue?: string;
  customerId?: string;
  items: Array<{
    productId?: string;
    title: string;
    quantity: number;
    unitAmount: Amount;
  }>;
  totalAmount: Amount;
};

type SellerPaymentIntent = {
  id: string;
  status: "requires-customer" | "requires-capture" | "succeeded" | "canceled" | "failed";
  customer?: {
    id: string;
    displayName: string;
    balance: Amount;
  };
  totalAmount: Amount;
  expiresAt: string;
};
```

### 5.6 방문 인증/스탬프/랭킹

소비자 화면에 부스 랭킹, 방문 인증 후 구매 가능, 행사 입장 QR 단말기가 있으므로 운영 API가 필요하다.

| Method | Path | 용도 |
| --- | --- | --- |
| `POST` | `/api/seller/booths/:boothId/visits/verify` | QR/NFC/코드 방문 인증 |
| `GET` | `/api/seller/booths/:boothId/visits` | 방문자/체크인 목록 |
| `POST` | `/api/customer/booths/:boothId/check-in` | 소비자 직접 체크인 |
| `GET` | `/api/customer/booth-rankings` | 부스 포인트 랭킹 |
| `GET` | `/api/seller/booths/:boothId/ranking` | 내 부스 랭킹/점수 |
| `POST` | `/api/admin/ranking-rules` | 랭킹 산정 규칙 관리 |

```ts
type BoothVisit = {
  id: string;
  boothId: string;
  customerId: string;
  method: "qr" | "nfc" | "manual-code" | "payment";
  checkedInAt: string;
  reward?: Amount;
};
```

### 5.7 문의/채팅/공지

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/customer/inquiries?targetType=booth&targetId=` | 소비자 문의 목록 |
| `POST` | `/api/customer/inquiries` | 문의 생성 |
| `GET` | `/api/seller/booths/:boothId/inquiries` | 부스 문의함 |
| `POST` | `/api/seller/inquiries/:inquiryId/replies` | 문의 답변 |
| `POST` | `/api/seller/booths/:boothId/notices` | 부스 공지 등록 |

### 5.8 정산/리포트

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/seller/booths/:boothId/dashboard` | 오늘 매출, 주문, 대기, 재고 알림 |
| `GET` | `/api/seller/booths/:boothId/settlements` | 정산 목록 |
| `GET` | `/api/seller/settlements/:settlementId` | 정산 상세 |
| `GET` | `/api/seller/booths/:boothId/reports/sales` | 판매 리포트 |
| `GET` | `/api/seller/booths/:boothId/reports/inventory` | 재고 리포트 |
| `POST` | `/api/seller/booths/:boothId/exports` | CSV/XLSX 내보내기 생성 |

## 6. 관리자 API

관리자 앱은 아직 scaffold지만, 소비자/부스 운영 흐름을 운영하려면 아래 API가 필요하다.

### 6.1 축제/부스 마스터 데이터

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/admin/festivals` | 축제 목록 |
| `POST` | `/api/admin/festivals` | 축제 생성 |
| `PATCH` | `/api/admin/festivals/:festivalId` | 기간/명칭/설정 수정 |
| `GET` | `/api/admin/booths` | 전체 부스 목록 |
| `POST` | `/api/admin/booths` | 부스 등록 |
| `PATCH` | `/api/admin/booths/:boothId` | 부스 정보 수정 |
| `GET` | `/api/admin/booth-categories` | 부스 카테고리 |
| `POST` | `/api/admin/booth-categories` | 카테고리 생성 |
| `PATCH` | `/api/admin/booth-categories/:categoryId` | 카테고리 수정 |
| `POST` | `/api/admin/maps` | 행사장 지도/위치 데이터 등록 |

### 6.2 사용자/권한/조직

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/admin/users` | 사용자 검색/목록 |
| `POST` | `/api/admin/users/import` | 학생/참가자 일괄 업로드 |
| `GET` | `/api/admin/users/:userId` | 사용자 상세 |
| `PATCH` | `/api/admin/users/:userId` | 사용자 정보 수정 |
| `GET` | `/api/admin/roles` | 역할 목록 |
| `POST` | `/api/admin/role-assignments` | 권한 부여 |
| `DELETE` | `/api/admin/role-assignments/:assignmentId` | 권한 회수 |

### 6.3 코인/포인트/원장

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/admin/wallets?userId=` | 사용자 지갑 조회 |
| `POST` | `/api/admin/wallets/adjustments` | 코인/포인트 수동 지급/차감 |
| `GET` | `/api/admin/ledger/transactions` | 전체 원장 조회 |
| `GET` | `/api/admin/ledger/exports` | 원장 내보내기 목록 |
| `POST` | `/api/admin/reward-rules` | 출석/커밋/페이백 보상 규칙 생성 |
| `PATCH` | `/api/admin/reward-rules/:ruleId` | 보상 규칙 수정 |

### 6.4 콘텐츠/배너/알림

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/admin/notices` | 공지 목록 |
| `POST` | `/api/admin/notices` | 공지 생성 |
| `PATCH` | `/api/admin/notices/:noticeId` | 공지 수정 |
| `GET` | `/api/admin/promotions` | 배너/프로모션 목록 |
| `POST` | `/api/admin/promotions` | 배너 생성 |
| `PATCH` | `/api/admin/promotions/:promotionId` | 배너 수정 |
| `POST` | `/api/admin/notifications` | 푸시/인앱 알림 발송 |
| `POST` | `/api/files/uploads` | 이미지 업로드 |

### 6.5 월드컵/승부예측 운영

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/admin/worldcup/teams` | 팀 목록 |
| `POST` | `/api/admin/worldcup/teams` | 팀 생성 |
| `GET` | `/api/admin/worldcup/matches` | 경기 목록 |
| `POST` | `/api/admin/worldcup/matches` | 경기 생성 |
| `PATCH` | `/api/admin/worldcup/matches/:matchId` | 점수/상태/시간 수정 |
| `PUT` | `/api/admin/worldcup/matches/:matchId/lineups` | 라인업 등록 |
| `PUT` | `/api/admin/worldcup/matches/:matchId/stats` | 경기 지표 등록 |
| `POST` | `/api/admin/worldcup/matches/:matchId/predictions/settle` | 예측 정산 |
| `GET` | `/api/admin/worldcup/predictions` | 예측 현황 조회 |

### 6.6 감사 로그/모니터링

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/admin/audit-logs` | 관리자/운영자 변경 이력 |
| `GET` | `/api/admin/system/health` | API/DB/결제 상태 |
| `GET` | `/api/admin/system/jobs` | 배치/정산/알림 작업 상태 |
| `POST` | `/api/admin/incidents` | 장애/현장 이슈 등록 |

## 7. 권장 우선순위

### P0: 소비자 앱 하드코딩 제거에 즉시 필요

1. `GET /api/customer/me`
2. `GET /api/customer/home`
3. `GET /api/customer/wallet/balances`
4. `POST /api/customer/pay/barcodes`
5. `GET /api/customer/ledger/recent`
6. `GET /api/customer/ledger/transactions`
7. `GET /api/customer/ledger/calendar`
8. `GET /api/customer/booth/categories`
9. `GET /api/customer/booth/products`
10. `GET /api/customer/booth/products/:productId`
11. `POST /api/customer/orders/preview`
12. `POST /api/customer/orders`
13. `GET /api/customer/points/commit-activity`
14. `GET /api/customer/worldcup/matches`
15. `GET /api/customer/worldcup/matches/:matchId`
16. `POST /api/customer/worldcup/matches/:matchId/predictions`

### P1: 부스 현장 운영 오픈에 필요

1. 운영자 로그인/권한
2. 부스 프로필/운영 상태
3. 상품/재고 CRUD
4. 주문 큐/수령 처리
5. 바코드 조회/현장 결제 승인
6. 환불/취소
7. 방문 인증
8. 판매/정산 대시보드
9. 문의 답변

### P2: 관리자 운영 안정화에 필요

1. 축제/부스/지도 마스터 데이터
2. 사용자 일괄 업로드
3. 코인/포인트 수동 조정과 감사 로그
4. 배너/공지/알림 관리
5. 월드컵 경기/라인업/정산 관리
6. 전체 원장/정산 export

## 8. 첫 API 스펙 제안

프론트 연결 효율을 위해 첫 번째 백엔드 스펙은 화면 단위 aggregate와 도메인 단위 detail을 섞는 구성이 좋다.

```ts
// 홈 진입 1회 호출
GET /api/customer/home
Response: HomeResponse

// 페이 진입
GET /api/customer/wallet/balances
POST /api/customer/pay/barcodes
GET /api/customer/promotions?placement=pay
GET /api/customer/ledger/recent?scope=pay&limit=6

// 부스 진입
GET /api/customer/booth/home
Response: {
  categories: BoothCategory[];
  banners: PromotionBanner[];
  products: BoothProduct[];
}

// 상품 상세/결제
GET /api/customer/booth/products/:productId
POST /api/customer/orders/preview
POST /api/customer/orders

// 운영자 주문 처리
GET /api/seller/booths/:boothId/orders?status=paid,accepted,preparing,ready-for-pickup
PATCH /api/seller/orders/:orderId/status
POST /api/seller/pickup-vouchers/verify
POST /api/seller/pickup-vouchers/:voucherId/redeem
```

## 9. 미연결 UI 액션 체크리스트

- 헤더 검색 버튼: 검색 화면/검색 API 연결 필요
- 헤더 알림 버튼: 알림 목록/읽음 처리 API 연결 필요
- 헤더 장바구니 버튼: 장바구니 화면/API 연결 필요
- 홈 단축 버튼: 현재 클릭이 막혀 있으므로 각 기능 경로와 feature API 연결 필요
- 이자 혜택 CTA: 혜택 상세/수령 API 필요
- 공지 바: `/notices` 라우트와 공지 목록 API 필요
- 프로모션 배너: 상세 이동/참여 API 필요
- 부스 공유/찜/문의/장바구니: 모두 API 연결 필요
- 부스 결제 완료 후: 주문 상세/수령 QR 화면 필요
- 월드컵 예측 버튼: 예측 제출, 중복 제출 방지, 마감 시간, 포인트 차감/정산 필요
- 내역 탭: 월 이동 범위와 실제 거래 데이터 연결 필요
- 전체 메뉴: 서버 feature flag에 따라 노출 제어 필요

## 10. 백엔드 구현 시 주의사항

- DMC와 포인트는 서로 다른 자산으로 취급하고 원장도 분리 가능해야 한다.
- 결제/환불/보상/관리자 조정은 모두 immutable ledger entry로 남겨야 한다.
- 바코드와 수령 QR은 TTL, 1회 사용, 재사용 방지, 운영자 감사 로그가 필요하다.
- 부스 상품은 재고 예약과 결제 성공 사이의 race condition을 막아야 한다.
- 승부예측은 경기 시작 이후 제출 차단, 수정 가능 여부, 정산 중복 방지가 필요하다.
- 운영자/관리자 API는 권한 scope를 세분화하고 모든 변경 작업을 audit log에 남겨야 한다.
- 소비자 화면에서 쓰는 이미지 URL은 public path가 아니라 `MediaAsset`으로 내려주고, alt/background/dominant color를 함께 제공하는 편이 좋다.
