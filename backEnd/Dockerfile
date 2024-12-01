FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=4625

EXPOSE 4625

CMD [ "node", "server.js" ]