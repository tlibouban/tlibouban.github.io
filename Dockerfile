FROM nginx:1.29-alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy static site
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 