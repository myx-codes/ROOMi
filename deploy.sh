#!bin/bash

# Production
git reset --hard
git checkout main
git pull origin main

docker compuse up -d
