# Multi-stage build for React
FROM node:18-alpine as build

ARG REACT_APP_GOOGLE_MAPS_API_KEY
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_GOOGLE_MAPS_API_KEY=${REACT_APP_GOOGLE_MAPS_API_KEY}
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

ARG REACT_APP_WS_URL 
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
