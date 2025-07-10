#!/bin/bash

# ECR Deployment Script
# This script builds and pushes Docker images to Amazon ECR
# It uses ECR as the source of truth for versioning

set -e

echo "DEBUG: ECR Deployment Script started with parameters: $@"

# Check if app name is provided
if [ -z "$1" ]; then
  echo "Error: App name is required"
  echo "Usage: ./ecr-deploy.sh <app-name> <bump-type> [--dry-run]"
  exit 1
fi

# Check if bump type is provided
if [ -z "$2" ]; then
  echo "Error: Bump type is required (patch, minor, or major)"
  echo "Usage: ./ecr-deploy.sh <app-name> <bump-type> [--dry-run]"
  exit 1
fi

APP_NAME=$1
BUMP_TYPE=$2
DRY_RUN=false

# Check for dry run flag
if [[ "$3" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "Running in dry run mode. No changes will be applied."
fi

# ECR repository name
ECR_REPO_NAME="shula-${APP_NAME}"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
  echo "Error: Failed to get AWS account ID. Make sure AWS CLI is configured correctly."
  exit 1
fi

# Get AWS region from environment or use default
AWS_REGION=${AWS_REGION:-"us-east-1"}

# ECR repository URL
ECR_REPO_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "=== ECR Deployment for ${APP_NAME} ==="
echo "AWS Account: ${AWS_ACCOUNT_ID}"
echo "AWS Region: ${AWS_REGION}"
echo "ECR Repository: ${ECR_REPO_NAME}"
echo "Bump Type: ${BUMP_TYPE}"

# Run version manager to get the new version
echo -e "\nRunning version manager..."
if [ "$DRY_RUN" = true ]; then
  NEW_VERSION=$(node scripts/version-manager.js ${APP_NAME} ${BUMP_TYPE} --dry-run)
else
  NEW_VERSION=$(node scripts/version-manager.js ${APP_NAME} ${BUMP_TYPE})
fi

# Extract the version number from the output
NEW_VERSION=$(echo "$NEW_VERSION" | tail -n 1)

# Get the commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

# Read Docker tags from the file or create default tags
TAGS_FILE="apps/${APP_NAME}/docker-tags.txt"
if [ ! -f "$TAGS_FILE" ]; then
  echo "Warning: Tags file not found at ${TAGS_FILE}"
  echo "Creating default tags based on version ${NEW_VERSION}"
  
  # Create tags directory if it doesn't exist
  mkdir -p "apps/${APP_NAME}"
  
  # Create default tags
  echo "${NEW_VERSION}-${COMMIT_HASH}" > "$TAGS_FILE"
  echo "${NEW_VERSION}" >> "$TAGS_FILE"
  echo "latest" >> "$TAGS_FILE"
  
  echo "DEBUG: Created tags file with contents:"
  cat "$TAGS_FILE"
else
  echo "DEBUG: Using existing tags file at ${TAGS_FILE} with contents:"
  cat "$TAGS_FILE"
  echo "DEBUG: Checking if 'latest' tag is in the file..."
  if grep -q "latest" "$TAGS_FILE"; then
    echo "DEBUG: 'latest' tag found in tags file"
  else
    echo "DEBUG: 'latest' tag NOT found in tags file, adding it..."
    echo "latest" >> "$TAGS_FILE"
    echo "DEBUG: Updated tags file contents:"
    cat "$TAGS_FILE"
  fi
fi

# Build the Docker image
echo -e "\nBuilding Docker image for ${APP_NAME}..."
if [ "$DRY_RUN" = true ]; then
  echo "Dry run: Would build Docker image with command:"
  echo "docker build -t ${ECR_REPO_NAME}:${NEW_VERSION} -f apps/${APP_NAME}/Dockerfile ."
else
  docker build -t ${ECR_REPO_NAME}:${NEW_VERSION} -f apps/${APP_NAME}/Dockerfile .
  if [ $? -ne 0 ]; then
    echo "Error: Docker build failed"
    exit 1
  fi
  echo "Docker image built successfully"
fi

# Log in to ECR
if [ "$DRY_RUN" = false ]; then
  echo -e "\nLogging in to ECR..."
  aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
  if [ $? -ne 0 ]; then
    echo "Error: Failed to log in to ECR"
    exit 1
  fi
fi

# Create ECR repository if it doesn't exist
if [ "$DRY_RUN" = false ]; then
  echo -e "\nChecking if ECR repository exists..."
  aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} > /dev/null 2>&1 || \
  aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${AWS_REGION}
  echo "ECR repository is ready"
fi

# Tag and push the Docker image with all tags
echo -e "\nTagging and pushing Docker image with tags:"
echo "DEBUG: Contents of tags file ($TAGS_FILE):"
cat "$TAGS_FILE"
echo "DEBUG: End of tags file contents"

while read -r TAG; do
  FULL_TAG="${ECR_REPO_URL}:${TAG}"
  echo "- ${FULL_TAG}"
  
  if [ "$DRY_RUN" = false ]; then
    echo "DEBUG: Tagging image as ${FULL_TAG}"
    docker tag ${ECR_REPO_NAME}:${NEW_VERSION} ${FULL_TAG}
    echo "DEBUG: Pushing image ${FULL_TAG}"
    docker push ${FULL_TAG}
    PUSH_RESULT=$?
    if [ $PUSH_RESULT -ne 0 ]; then
      echo "ERROR: Failed to push ${FULL_TAG}, exit code: ${PUSH_RESULT}"
    else
      echo "DEBUG: Push completed for ${FULL_TAG}"
    fi
  fi
done < "$TAGS_FILE"

if [ "$DRY_RUN" = true ]; then
  echo -e "\nDry run completed. No changes were applied."
else
  echo -e "\nDeployment completed successfully!"
  echo "New version ${NEW_VERSION} of ${APP_NAME} has been pushed to ECR"
fi

exit 0 