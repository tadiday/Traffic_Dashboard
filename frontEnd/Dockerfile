FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=4624

EXPOSE 4624

CMD [ "npm", "start" ]