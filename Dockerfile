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

RUN apk add --no-cache python3 make g++

COPY collab/package*.json ./
RUN npm install --production

# ---------- Stage 3: build Go backend ----------
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

# Build web and cli binaries
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    GOOS=linux GOARCH=amd64 go build \
    -ldflags "-X main.Version=${APP_VERSION}" \
    -o /out/web ./cmd/web/main.go

RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    GOOS=linux GOARCH=amd64 go build \
    -ldflags "-X main.Version=${APP_VERSION}" \
    -o /out/cli ./cmd/cli/main.go

# ---------- Stage 4: final runtime ----------
FROM node:20-alpine
WORKDIR /usr/local/app

RUN apk add --no-cache tzdata

ENV TZ="UTC"

COPY ./migrations /usr/local/app/migrations

# Copy Go binaries
COPY --from=backend /out/web ./web
COPY --from=backend /out/cli ./cli

# Copy collab service
COPY --from=collab-deps /app/collab/node_modules ./collab/node_modules
COPY collab/src ./collab/src
COPY collab/package.json ./collab/package.json

RUN mkdir -p ./bin
VOLUME /usr/local/app/bin
