# ---- build stage ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
# better-sqlite3 needs build tools if no prebuilt binary matches.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && npm install --omit=dev \
  && apt-get purge -y python3 make g++ && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*
# dist already contains schema.sql (copied by the build script).
COPY --from=build /app/dist ./dist
EXPOSE 4000
VOLUME ["/app/data"]
CMD ["node", "dist/index.js"]
