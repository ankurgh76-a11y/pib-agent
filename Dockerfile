# Use the official Microsoft Playwright image as base
# It contains all the Linux libraries needed to run Chromium
FROM mcr.microsoft.com/playwright:v1.41.2-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]
