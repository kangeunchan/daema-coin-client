# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY libs ./libs

RUN bun install --frozen-lockfile

FROM deps AS build
ARG APP_NAME=customer
ARG VITE_CUSTOMER_API_BASE_URL=https://daema-server-prod.dsmhs.kr/api
ENV VITE_CUSTOMER_API_BASE_URL=${VITE_CUSTOMER_API_BASE_URL}

RUN bun run build --filter=@daema/${APP_NAME}

FROM nginx:1.29-alpine AS runtime
ARG APP_NAME=customer

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/${APP_NAME}/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
