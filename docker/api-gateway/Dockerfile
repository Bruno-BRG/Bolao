FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/nginx-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV POSTGREST_HOST=postgrest

EXPOSE 8000

CMD ["/docker-entrypoint.sh"]
