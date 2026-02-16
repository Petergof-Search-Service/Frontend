# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production=false

COPY . .
RUN npm run build

# Stage 2: serve (Infra проксирует на этот контейнер)
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/build /usr/share/nginx/html

RUN sed -i 's|location / {|location / { try_files $uri $uri/ /index.html;|' /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
