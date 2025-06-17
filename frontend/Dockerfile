FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run dev

# Install serve for production
RUN npm install -g serve

EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]