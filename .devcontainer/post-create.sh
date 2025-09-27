#!/bin/bash

echo "Waiting for MySQL to start..."
while ! mysqladmin ping -h"db" --silent; do
    sleep 1
done
echo "MySQL started"

echo "Setting up Backend..."
cd /workspace/backend
mvn clean install -DskipTests

echo "Setting up Frontend..."
cd /workspace/frontend
npm install

echo "Development environment setup complete! You can now run the application:"
echo "- Backend: cd backend && mvn spring-boot:run"
echo "- Frontend: cd frontend && npm start"