FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build --chown=node:node /app/.output ./.output
COPY --chown=node:node scripts/init-couchdb.mjs ./scripts/init-couchdb.mjs
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
