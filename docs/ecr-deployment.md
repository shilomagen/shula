# ECR Deployment Process

This document outlines the process for deploying Docker images to Amazon Elastic Container Registry (ECR) using our CI/CD pipeline.

## Overview

Our deployment process uses Amazon ECR as the source of truth for versioning. Instead of maintaining version files in the repository, we retrieve the latest version information directly from ECR, increment it according to semantic versioning rules, and push new versions to the registry.

## Versioning Strategy

We use semantic versioning (SemVer) for our Docker images:

- **Major version**: Incremented for incompatible API changes
- **Minor version**: Incremented for backward-compatible functionality additions
- **Patch version**: Incremented for backward-compatible bug fixes

Each Docker image is tagged with:
- The full semantic version (e.g., `1.2.3`)
- The semantic version with commit hash (e.g., `1.2.3-a1b2c3d`)
- The `latest` tag

## Deployment Process

The deployment process consists of the following steps:

1. **Version Management**: The `version-manager.js` script retrieves the latest version from ECR, increments it according to the specified bump type (patch, minor, or major), and generates appropriate Docker tags.

2. **Docker Image Building**: The application is built and packaged into a Docker image using the appropriate Dockerfile.

3. **ECR Authentication**: The deployment script authenticates with AWS ECR using the provided credentials.

4. **Image Tagging and Pushing**: The Docker image is tagged with the appropriate version tags and pushed to ECR.

## CI/CD Integration

Our GitHub Actions workflow automates the deployment process:

1. When code is pushed to the main branch, the CI/CD pipeline runs tests and builds the affected applications.
2. If tests pass, the pipeline determines which applications need to be deployed.
3. For each affected application, the pipeline:
   - Determines the version bump type based on commit message tags (`[major]`, `[minor]`, or defaults to `patch`)
   - Runs the deployment script to build, tag, and push the Docker image to ECR

## Version Bump Types

The version bump type can be specified in the commit message:

- Include `[major]` in the commit message to bump the major version
- Include `[minor]` in the commit message to bump the minor version
- If neither is specified, the patch version is bumped by default

## Manual Deployment

To manually deploy an application to ECR:

1. Ensure you have AWS credentials configured
2. Run the deployment script:

```bash
./scripts/ecr-deploy.sh <app-name> <bump-type>
```

Where:
- `<app-name>` is the name of the application (e.g., `backend`, `whatsapp-container`)
- `<bump-type>` is the type of version bump (`patch`, `minor`, or `major`)

To perform a dry run without actually deploying:

```bash
./scripts/ecr-deploy.sh <app-name> <bump-type> --dry-run
```

## Retrieving the Latest Version

To retrieve the latest version of an application from ECR:

```bash
aws ecr describe-images --repository-name shula-<app-name> --query 'imageDetails[*].imageTags[*]' --output json | jq -r 'flatten | map(select(test("^[0-9]+\\.[0-9]+\\.[0-9]+$"))) | sort_by(split(".") | map(tonumber)) | reverse | .[0]'
```

Replace `<app-name>` with the name of the application (e.g., `backend`, `whatsapp-container`).

## Benefits of ECR-Based Versioning

Using ECR as the source of truth for versioning offers several advantages:

1. **Centralized Version Management**: All version information is stored in one place (ECR)
2. **No Version File Conflicts**: Eliminates the need to commit version files back to the repository
3. **Simplified CI/CD**: No need to handle Git operations in the CI/CD pipeline
4. **Consistent Deployment**: The same versioning logic is used regardless of where deployment is triggered from 