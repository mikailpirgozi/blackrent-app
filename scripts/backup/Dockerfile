# Railway Backup Service Dockerfile
FROM node:18-bullseye-slim

# Inštalácia PostgreSQL 16 client a AWS CLI
RUN apt-get update && \
    apt-get install -y wget ca-certificates curl unzip && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y postgresql-client-16 && \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Nastavenie pracovného adresára
WORKDIR /app

# Kopírovanie package súborov
COPY package*.json ./

# Inštalácia Node.js dependencies
RUN npm install

# Kopírovanie aplikačných súborov
COPY . .

# Nastavenie executable permissions
RUN chmod +x railway-cron-backup.js

# Spustenie aplikácie
CMD ["npm", "run", "backup"]
