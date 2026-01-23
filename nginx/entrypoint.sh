#!/bin/sh
htpasswd -bc /etc/nginx/.htpasswd "${ADMIN_USER:-admin}" "${ADMIN_PASSWORD:-changeme}"
exec nginx -g 'daemon off;'
