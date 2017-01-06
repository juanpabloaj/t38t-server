FROM node

ADD . /app
WORKDIR /app

RUN npm install -g forever
RUN npm install

EXPOSE 8080
CMD ["forever", "-w", "index.js"]
