# A reviewed lockfile is required so production images are reproducible.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY tsconfig.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOADS_DIRECTORY=/app/private-uploads
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node src ./src
COPY --chown=node:node tsconfig.json ./tsconfig.json
COPY --chown=node:node package.json ./package.json
RUN mkdir -p /app/private-uploads && chown -R node:node /app/private-uploads
EXPOSE 3000
USER node
CMD ["node", "dist/main"]
