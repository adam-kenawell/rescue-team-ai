# Deployment Guide

## Prerequisites
- Digital Ocean droplet with Docker & nginx installed
- DNS A record: `rescue.adam.kenawell.family` -> droplet IP
- GitHub Container Registry (ghcr.io) access

## 1. DNS Setup
Add an A record in your domain registrar:
```
Type: A
Host: rescue
Value: <DROPLET_IP>
TTL: 300
```

## 2. Build & Push Image (from local machine)
```bash
# Authenticate with GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u adam-kenawell --password-stdin

# Build and push
docker build -t ghcr.io/adam-kenawell/rescue-team-ai:latest .
docker push ghcr.io/adam-kenawell/rescue-team-ai:latest
```

## 3. Droplet Setup (SSH into droplet)
```bash
# Pull the image
echo $GITHUB_TOKEN | docker login ghcr.io -u adam-kenawell --password-stdin
docker pull ghcr.io/adam-kenawell/rescue-team-ai:latest

# Create .env from example
cp .env.example .env
# Edit .env with real values (generate a secret key!)
python3 -c "from secrets import token_urlsafe; print(token_urlsafe(50))"

# Copy nginx config
sudo cp deploy/nginx/rescue-team-ai.conf /etc/nginx/sites-available/rescue-team-ai
sudo ln -sf /etc/nginx/sites-available/rescue-team-ai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d rescue.adam.kenawell.family

# Run
docker compose up -d

# Copy static files to nginx-served directory
sudo mkdir -p /var/www/rescue-team-ai/staticfiles
docker cp $(docker compose ps -q web):/app/staticfiles/. /var/www/rescue-team-ai/staticfiles/
```

## 4. Verify
Visit `https://rescue.adam.kenawell.family/game/onboarding/`

## Redeployment
```bash
docker compose pull
docker compose up -d
docker cp $(docker compose ps -q web):/app/staticfiles/. /var/www/rescue-team-ai/staticfiles/
```
