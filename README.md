# Daema Client

Bun, Vite, React, TypeScript, Tailwind CSS, Turborepo, and mise 기반의 클라이언트 모노레포입니다.

## Structure

- `apps/customer`: 고객용 앱
- `apps/seller`: 판매자용 앱
- `apps/admin`: 관리자용 앱
- `libs/design-tokens`: 공통 디자인 토큰과 CSS variables
- `libs/ui`: 공통 React UI primitives
- `libs/shared`: 공통 도메인 유틸리티

## Commands

```sh
mise run install
mise run dev-customer
mise run dev-seller
mise run dev-admin
mise run check
```

개별 앱 포트는 고객 `5173`, 판매자 `5174`, 관리자 `5175`입니다.
