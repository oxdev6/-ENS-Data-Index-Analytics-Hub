FROM node:20-alpine AS deps
# Build context should be the repo root, using: docker build -f apps/api/Dockerfile .
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm --workspace apps/api run prisma:generate && npm --workspace apps/api run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Use workspace-installed modules from the deps stage
COPY --from=deps /app/node_modules /app/node_modules
# Copy only the API dist and package.json
COPY apps/api/dist /app/dist
COPY apps/api/package.json /app/package.json
EXPOSE 4000
CMD ["node", "dist/index.js"]

