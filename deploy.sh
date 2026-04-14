#!bin/bash

# Production
git reset --hard
git checkout main
git pull origin main

docker compose up -d
