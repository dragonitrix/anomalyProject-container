FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 20201

CMD ["node" , "server.js"]

# FROM node:14
# 
# WORKDIR /code
# 
# ENV PORT 20201
# 
# COPY package.json /code/package.json
# 
# RUN npm install
# 
# COPY . /code
# 
# CMD ["node" , "server.js"]