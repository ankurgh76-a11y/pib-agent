# Use the latest official Playwright image (v1.49 contains Node 20.18+)
FROM mcr.microsoft.com/playwright:v1.49.0-noble

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
