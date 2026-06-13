FROM nginxinc/nginx-unprivileged:alpine

# Copy cấu hình Nginx (chạy ở port 8080 phi-root)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy mã nguồn static files của Frontend
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
