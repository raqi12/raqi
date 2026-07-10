FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY dist ./dist
RUN mkdir -p uploads/deposits

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
