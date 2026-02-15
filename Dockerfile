FROM node:18-alpine AS build

ENV REACT_APP_API_URL=http://158.160.145.236:8000/api/v1
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

ENV REACT_APP_API_URL=http://158.160.145.236:8000/api/v1
RUN npm install -g serve

COPY --from=build /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]