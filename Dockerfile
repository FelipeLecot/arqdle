# Production image for Arqdle.
#
# The build stage compiles the Vite client and bundles the Express server.
# SITE_URL is baked into index.html (canonical, Open Graph, hreflang), so it
# must be passed as a build argument.
FROM node:22-alpine AS build
WORKDIR /app

ARG SITE_URL=https://arqdle.com
ENV SITE_URL=${SITE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
