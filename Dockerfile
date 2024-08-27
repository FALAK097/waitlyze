FROM node:18-alpine

WORKDIR /app
RUN npm install -g yarn --force
COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 3000
CMD yarn dev
