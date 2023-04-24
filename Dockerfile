FROM node:18-alpine

WORKDIR /app

COPY package.json .

COPY package-lock.json .

RUN npm ci

COPY prisma ./prisma/

COPY .env .

COPY . .

EXPOSE 3000

RUN npx prisma generate

CMD [ "npm", "run", "start:dev" ]