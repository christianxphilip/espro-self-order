FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build argument for VITE_API_URL (can be overridden)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application (Vite will embed VITE_API_URL at build time)
RUN npm run build

FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY start-nginx.sh /start-nginx.sh

RUN chmod +x /start-nginx.sh

EXPOSE 80

# Default backend URL (can be overridden by environment variable)
ENV BACKEND_URL=http://espro-self-ordering-backend:7001

CMD ["/start-nginx.sh"]
