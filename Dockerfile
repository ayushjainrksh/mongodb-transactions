FROM node:14
#Create app directory
WORKDIR /urs/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]