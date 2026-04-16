# Use a lightweight Node.js image
# We no longer need the heavy Playwright/Chromium image!
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only necessary dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]
