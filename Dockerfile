FROM node:lts-buster
RUN git clone https://github.com/Itzpatron/PATRON-MD2/root/Patron
WORKDIR /root/Patron
RUN npm install && npm install -g pm2 || yarn install --network-concurrency 1
COPY . .
EXPOSE 9090
CMD ["npm", "start"]
