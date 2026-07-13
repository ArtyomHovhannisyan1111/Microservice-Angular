#!/bin/bash
set -e

SERVER="root@167.233.226.5"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE_DIR="/root/mikroservis"

echo "==> Connecting to $SERVER..."

ssh -i "$SSH_KEY" -p 2222 -o StrictHostKeyChecking=no "$SERVER" bash << ENDSSH
  set -e

  # Clone if not exists, otherwise pull
  if [ ! -d "$REMOTE_DIR" ]; then
    echo "==> Cloning repository..."
    git clone https://github.com/ArtyomHovhannisyan1111/Microservice-Angular.git "$REMOTE_DIR"
  fi

  cd "$REMOTE_DIR"

  echo "==> Pulling latest changes..."
  git pull origin master

  echo "==> Writing .env..."
  cat > .env << 'EOF'
MAIL_USERNAME=javaai2026@gmail.com
MAIL_PASSWORD=xqgu riev zykv wwew
DOCKER_HUB_USER=artyom0510
EOF

  echo "==> Cleaning up Docker build cache..."
  docker builder prune -f

  echo "==> Building services one by one (no-parallel to save disk space)..."
  docker compose build --no-parallel

  echo "==> Starting containers..."
  docker compose up -d

  echo "==> Done! Container status:"
  docker compose ps
ENDSSH
