# ---------- Stage 1: build frontend (SPA) ----------
FROM node:20-alpine AS frontend
WORKDIR /app/web

# Accept version as build argument
ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

COPY web/package*.json ./
RUN npm ci

COPY web/ .
RUN npm run build

# ---------- Stage 2: build Go backend ----------
FROM golang:1.25-alpine AS backend
WORKDIR /app

# Accept version as build argument
ARG APP_VERSION=dev

ENV CGO_ENABLED=1

RUN apk add --no-cache \
    # Important: required for go-sqlite3
    gcc \
    # Required for Alpine
    musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=frontend /app/web/dist /app/internal/server/dist

RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    GOOS=linux GOARCH=amd64 go build \
    -ldflags "-X main.Version=${APP_VERSION}" \
    -o /out/app ./cmd/notepia/notepia.go

# ---------- Stage 3: final runtime ----------

FROM alpine:latest AS monolithic
WORKDIR /usr/local/app

RUN apk add --no-cache tzdata

ENV TZ="UTC"

COPY ./migrations /usr/local/app/migrations

COPY --from=backend /out/app ./app

RUN mkdir -p ./bin
VOLUME /usr/local/app/bin

ENTRYPOINT ["./app"]
