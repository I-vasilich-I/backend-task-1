FROM node:18-alpine

WORKDIR /app

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium 

COPY package.json .

COPY package-lock.json .

RUN npm ci

COPY prisma ./prisma/

COPY .env .

COPY . .

EXPOSE 3000

RUN npx prisma generate

CMD [ "npm", "run", "start:dev" ]