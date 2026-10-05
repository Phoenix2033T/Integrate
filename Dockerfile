FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/core/package.json ./packages/core/package.json
RUN npm install

COPY . .
RUN npm run typecheck:web && npm run build:web

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["npm", "--workspace", "@integrate/web", "run", "start"]
