FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        nginx \
        openjdk-21-jre-headless \
        supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /etc/nginx/conf.d /etc/supervisor/conf.d /srv/deploy /var/log/supervisor

COPY infra/docker/shared-runtime/nginx.conf /etc/nginx/nginx.conf
COPY infra/docker/shared-runtime/supervisord.conf /etc/supervisor/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
