FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .
COPY ../../package.json ../../package-lock.json /
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /node_modules /node_modules
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY prisma ../../packages/db/prisma
EXPOSE 4000
CMD ["node", "dist/index.js"]

