import type { ElementType } from "react";
import {
  BuildingStorefrontIcon,
  CircleStackIcon,
  CreditCardIcon,
  GiftIcon,
  HomeIcon,
  MusicalNoteIcon,
  Squares2X2Icon,
  TrophyIcon,
  WalletIcon,
} from "@heroicons/react/24/solid";

import { customerColor } from "../../../shared/styles/customerTokens";

export type IconComponent = ElementType<{
  "aria-hidden"?: boolean | "true" | "false";
  className?: string;
}>;

export type WalletAsset = {
  label: string;
  value: string;
};

export type Shortcut = {
  icon: IconComponent;
  label: string;
  soft?: boolean;
  tone: string;
};

export type PromoBanner = {
  iconSrc: string;
  kicker: string;
  title: string;
};

export type RecentTransaction = {
  amount: string;
  meta: string;
  time: string;
};

export type RankingEntry = {
  name: string;
  points: number;
  rank: number;
  tone: string;
};

export type NavigationTab = {
  icon: IconComponent;
  id: "home" | "pay" | "map" | "points" | "all";
  label: string;
  path: string;
};

export const navigationTabs = [
  { icon: HomeIcon, id: "home", label: "홈", path: "/" },
  { icon: CreditCardIcon, id: "pay", label: "페이", path: "/pay" },
  { icon: BuildingStorefrontIcon, id: "map", label: "부스", path: "/booth" },
  { icon: CircleStackIcon, id: "points", label: "포인트", path: "/points" },
  { icon: Squares2X2Icon, id: "all", label: "전체", path: "/all" },
] satisfies readonly NavigationTab[];

export const walletAssets = [
  { label: "대마코인", value: "12,480 DMC" },
  { label: "대마포인트", value: "82,500 P" },
] satisfies readonly WalletAsset[];

export const shortcuts = [
  { icon: CreditCardIcon, label: "결제", tone: "#94a3b8" },
  { icon: WalletIcon, label: "통합 내역", tone: "#10b981" },
  { icon: CircleStackIcon, label: "매일모으기", tone: "#f97316" },
  { icon: TrophyIcon, label: "승부예측", tone: customerColor.brand },
  { icon: BuildingStorefrontIcon, label: "부스", tone: "#64748b" },
  { icon: MusicalNoteIcon, label: "공연", tone: "#8b5cf6" },
  { icon: GiftIcon, label: "혜택", tone: "#374151" },
  { icon: Squares2X2Icon, label: "전체", tone: "#0f766e" },
] satisfies readonly Shortcut[];

export const promoBanners = [
  {
    iconSrc: "/3dicons/coin.png",
    kicker: "코드를 작성할때 받는 혜택!",
    title: "1,000P 받기",
  },
  {
    iconSrc: "/3dicons/trophy.png",
    kicker: "월드컵 결과 예측하고 혜택받기!",
    title: "대한민국 화이팅",
  },
] satisfies readonly PromoBanner[];

export const festivalBanner = {
  iconSrc: "/3dicons/festival-calendar.png",
  kicker: "청축제에서 신나게 놀자!",
  title: "일정 알아보기",
} satisfies PromoBanner;

export const recentTransactions = [
  { meta: "적립 ㅣ [혜택] 출석체크 출석 리워드", amount: "금액 보기", time: "2시간 전" },
  { meta: "적립 ㅣ 대마페이 보너스", amount: "금액 보기", time: "11시간 전" },
  { meta: "사용 ㅣ 굿딜 딘즈 쿠폰", amount: "금액 보기", time: "어제" },
  { meta: "적립 ㅣ 매일모으기 리워드", amount: "금액 보기", time: "어제" },
  { meta: "적립 ㅣ 코드 작성 혜택", amount: "금액 보기", time: "2일 전" },
  { meta: "사용 ㅣ 포인트 교환", amount: "금액 보기", time: "3일 전" },
] satisfies readonly RecentTransaction[];

export const personalPodiumRankings = [
  { name: "이서연", points: 90400, rank: 2, tone: "#64748b" },
  { name: "김민준", points: 96200, rank: 1, tone: "#f59e0b" },
  { name: "박지호", points: 88100, rank: 3, tone: "#10b981" },
] satisfies readonly RankingEntry[];

export const boothPodiumRankings = [
  { name: "코딩 챌린지 부스", points: 1518800, rank: 2, tone: "#8b5cf6" },
  { name: "월드컵 응원 부스", points: 1842000, rank: 1, tone: "#ef4444" },
  { name: "출석 리워드 부스", points: 1213000, rank: 3, tone: "#10b981" },
] satisfies readonly RankingEntry[];
