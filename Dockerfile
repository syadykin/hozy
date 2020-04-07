FROM node:12.16-stretch as modules

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --production

FROM node:12.16-stretch as build

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
COPY . /app
RUN npm run build

FROM node:12.16-stretch

WORKDIR /app
COPY --from=modules /app/node_modules /app/node_modules
COPY --from=build /app/build/src /app/package.json /app/
COPY --from=build /app/config /app/config

VOLUME [ "/app/config" ]

CMD node ./main.js
