FROM node

ADD . /app
WORKDIR /app

RUN npm install -g forever
RUN npm install

CMD ["forever", "-w", "index.js"]
