#!/usr/bin/env node

/**
 * Version Manager Script
 * 
 * This script manages semantic versioning for Docker images using ECR as the source of truth.
 * It retrieves the latest version from ECR, increments it according to the bump type,
 * and generates appropriate tags for new images.
 * 
 * Usage:
 *   node version-manager.js <app-name> <bump-type> [--dry-run]
 * 
 * Arguments:
 *   app-name: The name of the application (e.g., backend, whatsapp-container)
 *   bump-type: The type of version bump (patch, minor, major)
 *   --dry-run: Optional flag to preview changes without applying them
 * 
 * Example:
 *   node version-manager.js backend patch
 */

const { execSync } = require('child_process');

// Parse command line arguments
const appName = process.argv[2];
const bumpType = process.argv[3];
const dryRun = process.argv.includes('--dry-run');

// Validate arguments
if (!appName || !['backend', 'whatsapp-container', 'admin'].includes(appName)) {
  console.error('Error: Please provide a valid app name (backend or whatsapp-container)');
  process.exit(1);
}

if (!bumpType || !['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('Error: Please provide a valid bump type (patch, minor, or major)');
  process.exit(1);
}

// Get the current commit hash
const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

// ECR repository name
const ecrRepoName = `shula-${appName}`;

// Get AWS region from environment or use default
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Function to get the latest version from ECR
function getLatestVersionFromECR() {
  try {
    // Default to 1.0.0 if no version is found in ECR
    let latestVersion = '1.0.0';
    
    if (dryRun) {
      console.log('Dry run mode: Assuming latest version is 1.0.0');
      return latestVersion;
    }
    
    // List image tags from ECR
    const listImagesCmd = `aws ecr describe-images --repository-name ${ecrRepoName} --region ${awsRegion} --query 'imageDetails[*].imageTags[*]' --output json`;
    
    try {
      const imagesOutput = execSync(listImagesCmd).toString();
      const allTags = JSON.parse(imagesOutput).flat().filter(Boolean);
      
      // Filter out tags that match semantic versioning pattern (x.y.z)
      const versionTags = allTags.filter(tag => /^\d+\.\d+\.\d+$/.test(tag));
      
      if (versionTags.length > 0) {
        // Sort versions and get the latest one
        versionTags.sort((a, b) => {
          const aParts = a.split('.').map(Number);
          const bParts = b.split('.').map(Number);
          
          for (let i = 0; i < 3; i++) {
            if (aParts[i] !== bParts[i]) {
              return bParts[i] - aParts[i]; // Descending order
            }
          }
          
          return 0;
        });
        
        latestVersion = versionTags[0];
        console.log(`Found latest version in ECR: ${latestVersion}`);
      } else {
        console.log(`No version tags found in ECR. Using default: ${latestVersion}`);
      }
    } catch (error) {
      // Repository might not exist yet
      console.log(`ECR repository ${ecrRepoName} not found or not accessible. Using default version: ${latestVersion}`);
    }
    
    return latestVersion;
  } catch (error) {
    console.error(`Error getting latest version from ECR: ${error.message}`);
    console.log('Using default version: 1.0.0');
    return '1.0.0';
  }
}

// Get the current version from ECR
const currentVersion = getLatestVersionFromECR();

// Parse the current version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate the new version based on bump type
let newVersion;
switch (bumpType) {
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
}

// Generate Docker tags
const dockerTags = [
  `${newVersion}-${commitHash}`,
  newVersion,
  'latest'
];

// Output the changes
console.log(`\n=== Version Update for ${appName} ===`);
console.log(`Current Version: ${currentVersion}`);
console.log(`New Version: ${newVersion}`);
console.log(`Commit Hash: ${commitHash}`);
console.log(`\nDocker Tags:`);
dockerTags.forEach(tag => console.log(`- ${ecrRepoName}:${tag}`));

// Create a file with the Docker tags for CI/CD use
if (!dryRun) {
  const fs = require('fs');
  const path = require('path');
  const tagsFilePath = path.join(process.cwd(), 'apps', appName, 'docker-tags.txt');
  
  // Ensure the directory exists
  const dirPath = path.dirname(tagsFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(tagsFilePath, dockerTags.join('\n'));
  console.log(`\nDocker tags saved to: ${tagsFilePath}`);
} else {
  console.log('\nDry run mode: No changes applied');
}

// Return the new version and tags for use in scripts
module.exports = {
  newVersion,
  commitHash,
  dockerTags,
  ecrRepoName
};

// If running directly, output the new version for use in shell scripts
if (require.main === module) {
  console.log(newVersion);
} 