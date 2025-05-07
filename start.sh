#!/bin/bash

# Check if the Docker image exists
if [[ "$(docker images -q traffic-visual-image 2> /dev/null)" == "" ]]; then
  echo "Docker image 'traffic-visual-image' not found. Building the image..."
  docker build -t traffic-visual-image .
else
  echo "Docker image 'traffic-visual-image' already exists. Skipping build."
fi

# Check if the Docker container is already running
if [[ "$(docker ps -q -f name=traffic-visual-container)" != "" ]]; then
  echo "Docker container 'traffic-visual-container' is already running."
elif [[ "$(docker ps -aq -f name=traffic-visual-container)" != "" ]]; then
  echo "Docker container 'traffic-visual-container' exists but is stopped. Starting it..."
  docker start traffic-visual-container
else
  echo "Docker container 'traffic-visual-container' does not exist. Creating and starting it..."
  docker run -d --name traffic-visual-container -p 4626:3306 traffic-visual-image
fi

# Run the MySQL container in the background

# Wait for MySQL to start (can take a few seconds)
sleep 8

# Start backend (make sure it listens on 0.0.0.0)
cd backEnd
npm install
nohup node server.js &

cd ../frontEnd
npm install
nohup npm start --host 0.0.0.0