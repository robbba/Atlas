FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/server/package.json ./packages/server/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY apps/team-manager ./apps/team-manager
COPY packages/core ./packages/core
COPY packages/server ./packages/server

RUN npm run build --workspace=@atlas/core && npm run build --workspace=@atlas/server
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV ATLAS_DB_PATH=/data/atlas.db
ENV ATLAS_CLIENT_DIST_PATH=/app/apps/team-manager

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/team-manager ./apps/team-manager
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/dist ./packages/server/dist

RUN mkdir /data && chown node:node /data
USER node

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "packages/server/dist/index.js"]