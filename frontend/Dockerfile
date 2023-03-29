FROM nginx:alpine

WORKDIR /etc/nginx/conf.d
COPY webgl.conf default.conf

# COPY webgl.conf /etc/nginx/conf.d/default.conf

WORKDIR /webgl
COPY webgl/ .