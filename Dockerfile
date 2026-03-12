# ---------- Stage 1: build frontend (SPA) ----------
FROM node:20-alpine AS frontend
WORKDIR /app/web

# Accept version as build argument
ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

COPY web/package.json ./
RUN npm install

COPY web/ .
RUN npm run build

# ---------- Stage 2: install collab service dependencies ----------
FROM node:20-alpine AS collab-deps
WORKDIR /app/collab

COPY collab/package*.json ./
RUN npm install --omit=dev

# ---------- Stage 3: build Go backend ----------
FROM golang:1.25-alpine AS backend
WORKDIR /app/api

# Accept version as build argument
ARG APP_VERSION=dev

ENV CGO_ENABLED=1

RUN apk add --no-cache \
    # Important: required for go-sqlite3
    gcc \
    # Required for Alpine
    musl-dev

COPY api/go.mod api/go.sum ./
RUN go mod download

COPY api/ .

# Build api and cli binaries
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    GOOS=linux GOARCH=amd64 go build \
    -ldflags "-X main.Version=${APP_VERSION}" \
    -o /out/api ./cmd/api/main.go

RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    GOOS=linux GOARCH=amd64 go build \
    -ldflags "-X main.Version=${APP_VERSION}" \
    -o /out/cli ./cmd/cli/main.go

# ---------- Stage 4: app runtime (Go API + Collab service) ----------
FROM node:20-alpine AS app-runtime
WORKDIR /usr/local/app

RUN apk add --no-cache tzdata

ENV TZ="UTC"

COPY ./api/migrations /usr/local/app/migrations

# Copy Go binaries
COPY --from=backend /out/api ./api
COPY --from=backend /out/cli ./cli

# Copy collab service
COPY --from=collab-deps /app/collab/node_modules ./collab/node_modules
COPY collab/src ./collab/src
COPY collab/package.json ./collab/package.json

RUN mkdir -p ./bin
VOLUME /usr/local/app/bin

# ---------- Stage 5: nginx with static frontend ----------
FROM nginx:alpine AS nginx-runtime
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /app/web/dist /usr/share/nginx/html
