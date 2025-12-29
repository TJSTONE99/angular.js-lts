#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for bower repositories
const BOWER_REPOS = [
  {
    name: 'bower-angular-lts',
    distPath: 'angular',
    files: ['angular.js', 'angular.min.js', 'angular.min.js.map'],
    additionalFiles: ['angular-csp.css'] // This file might exist in the bower repo
  },
  {
    name: 'bower-angular-sanitize-lts',
    distPath: 'angular-sanitize',
    files: ['angular-sanitize.js', 'angular-sanitize.min.js', 'angular-sanitize.min.js.map']
  },
  {
    name: 'bower-angular-resource-lts',
    distPath: 'angular-resource',
    files: ['angular-resource.js', 'angular-resource.min.js', 'angular-resource.min.js.map']
  }
];

// Configuration for npm packages
const NPM_PACKAGES = [
  {
    name: 'angular-lts',
    bowerRepoName: 'bower-angular-lts',
    description: 'AngularJS LTS (Long Term Support) - HTML enhanced for web apps'
  },
  {
    name: 'angular-sanitize-lts',
    bowerRepoName: 'bower-angular-sanitize-lts',
    description: 'AngularJS Sanitize LTS (Long Term Support) - AngularJS module for sanitizing HTML'
  },
  {
    name: 'angular-resource-lts',
    bowerRepoName: 'bower-angular-resource-lts',
    description: 'AngularJS Resource LTS (Long Term Support) - AngularJS module for interacting with RESTful server-side data sources'
  }
];

const log = (message) => {
  console.log(`[DEPLOY] ${message}`);
};

const execCommand = (command, options = {}) => {
  log(`Executing: ${command}`);
  try {
    return execSync(command, {
      stdio: 'inherit',
      cwd: options.cwd || dirname(__dirname),
      ...options
    });
  } catch (error) {
    log(`Error executing command: ${command}`);
    throw error;
  }
};

const readPackageJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    log(`Error reading package.json at ${path}: ${error.message}`);
    throw error;
  }
};

const writePackageJson = (path, data) => {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
    log(`Updated ${path}`);
  } catch (error) {
    log(`Error writing package.json at ${path}: ${error.message}`);
    throw error;
  }
};

const copyFiles = (sourceDir, targetDir, files) => {
  let copiedCount = 0;

  for (const file of files) {
    const sourcePath = join(sourceDir, file);
    const targetPath = join(targetDir, file);

    if (existsSync(sourcePath)) {
      try {
        copyFileSync(sourcePath, targetPath);
        log(`Copied ${file} to ${targetDir}`);
        copiedCount++;
      } catch (error) {
        log(`Warning: Failed to copy ${file}: ${error.message}`);
      }
    } else {
      log(`Warning: Source file ${sourcePath} does not exist`);
    }
  }

  return copiedCount;
};

const updateBowerVersion = (bowerRepoPath, version) => {
  const bowerJsonPath = join(bowerRepoPath, 'bower.json');

  if (!existsSync(bowerJsonPath)) {
    log(`Warning: bower.json not found at ${bowerJsonPath}`);
    return false;
  }

  try {
    const bowerJson = JSON.parse(readFileSync(bowerJsonPath, 'utf8'));
    bowerJson.version = version;

    // Update angular dependency version for angular-sanitize and angular-resource
    if (bowerJson.dependencies && bowerJson.dependencies.angular) {
      bowerJson.dependencies.angular = version;
    }

    writePackageJson(bowerJsonPath, bowerJson);
    return true;
  } catch (error) {
    log(`Error updating bower.json at ${bowerJsonPath}: ${error.message}`);
    return false;
  }
};

const createNpmPackageJson = (bowerRepoPath, packageName, version, description) => {
  const packageJsonPath = join(bowerRepoPath, 'package.json');
  
  // Create npm-specific package.json
  const packageJson = {
    name: packageName,
    version: version,
    description: description,
    license: 'MIT',
    author: 'Angular Core Team <angular-core+npm@google.com>',
    contributors: ['Thomas Stone <stone.tj.99@hotmail.co.uk>'],
    repository: {
      type: 'git',
      url: 'https://github.com/TJSTONE99/angular.js-lts.git'
    },
    keywords: ['lts', 'angularjs', 'angular']
  };
  
  // Set main file to index.js for all packages
  packageJson.main = 'index.js';
  
  // Set peer dependencies for non-core packages
  if (packageName === 'angular-sanitize-lts') {
    packageJson.peerDependencies = {
      'angular-lts': version
    };
  } else if (packageName === 'angular-resource-lts') {
    packageJson.peerDependencies = {
      'angular-lts': version
    };
  }
  
  // Write package.json
  writePackageJson(packageJsonPath, packageJson);
  log(`Created package.json for ${packageName} in ${bowerRepoPath}`);
  
  return true;
};

const commitAndTag = (repoPath, version, repoName) => {
  try {
    // Don't change process.cwd, instead pass cwd to execCommand
    log(`Working in directory: ${repoPath}`);

    // Check if tag already exists remotely
    const tagName = `v${version}`;
    try {
      const remoteTagResult = execCommand(`git ls-remote --tags origin ${tagName}`, { stdio: 'pipe', cwd: repoPath });
      if (remoteTagResult && remoteTagResult.toString().trim()) {
        log(`Tag ${tagName} already exists remotely in ${repoName}, skipping commit and tag operations`);
        return false; // Tag already exists, consider this as not successful for npm publishing
      }
    } catch (error) {
      // Error checking remote tags, continue with normal flow
      log(`Could not check remote tags for ${repoName}: ${error.message}`);
    }

    // Check if there are any changes to commit (both staged and unstaged)
    let hasChanges = false;

    try {
      // Check for unstaged changes by getting the list of modified files
      const unstagedResult = execCommand('git diff --name-only', { stdio: 'pipe', cwd: repoPath });
      const unstagedFiles = unstagedResult ? unstagedResult.toString().trim() : '';
      if (unstagedFiles.length > 0) {
        log(`Unstaged changes detected in ${repoName}: ${unstagedFiles.split('\n').join(', ')}`);
        hasChanges = true;
      } else {
        log(`No unstaged changes in ${repoName}`);
      }
    } catch (error) {
      log(`Error checking unstaged changes in ${repoName}: ${error.message}`);
    }

    try {
      // Check for staged changes
      const stagedResult = execCommand('git diff --cached --name-only', { stdio: 'pipe', cwd: repoPath });
      const stagedFiles = stagedResult ? stagedResult.toString().trim() : '';
      if (stagedFiles.length > 0) {
        log(`Staged changes detected in ${repoName}: ${stagedFiles.split('\n').join(', ')}`);
        hasChanges = true;
      } else {
        log(`No staged changes in ${repoName}`);
      }
    } catch (error) {
      log(`Error checking staged changes in ${repoName}: ${error.message}`);
    }

    try {
      // Check for untracked files
      const result = execCommand('git ls-files --others --exclude-standard', { stdio: 'pipe', cwd: repoPath });
      const untrackedFiles = result ? result.toString().trim() : '';
      if (untrackedFiles.length > 0) {
        log(`Untracked files detected in ${repoName}: ${untrackedFiles.split('\n').join(', ')}`);
        hasChanges = true;
      } else {
        log(`No untracked files in ${repoName}`);
      }
    } catch (error) {
      log(`Error checking untracked files in ${repoName}: ${error.message}`);
    }

    if (!hasChanges) {
      log(`No changes to commit in ${repoName}`);
      return false; // No changes to commit, don't proceed with npm publishing
    }

    log(`Changes detected in ${repoName}, proceeding with commit and tag`);

    // Add all changes
    execCommand('git add .', { cwd: repoPath });

    // Commit changes
    execCommand(`git commit -m "Release version ${version}"`, { cwd: repoPath });
    log(`Committed changes in ${repoName}`);

    // Create tag
    try {
      execCommand(`git tag -d ${tagName}`, { stdio: 'pipe', cwd: repoPath });
      log(`Removed existing tag ${tagName} in ${repoName}`);
    } catch (error) {
      // Tag doesn't exist, that's fine
    }

    execCommand(`git tag ${tagName}`, { cwd: repoPath });
    log(`Created tag ${tagName} in ${repoName}`);

    // Push changes and tags
    execCommand('git push origin HEAD', { cwd: repoPath });
    log(`Pushed changes for ${repoName}`);

    execCommand(`git push origin ${tagName}`, { cwd: repoPath });
    log(`Pushed tag ${tagName} for ${repoName}`);

    return true; // Successfully committed and tagged

  } catch (error) {
    log(`Error in git operations for ${repoName}: ${error.message}`);
    return false; // Failed to commit and tag
  }
};

const publishToNpm = (packageConfig, version) => {
  const bowerRepoPath = join(dirname(__dirname), '..', packageConfig.bowerRepoName);
  const packageJsonPath = join(bowerRepoPath, 'package.json');

  if (!existsSync(bowerRepoPath)) {
    log(`Warning: Bower repository ${packageConfig.bowerRepoName} does not exist at ${bowerRepoPath}, skipping npm publish for ${packageConfig.name}`);
    return false;
  }

  try {
    // package.json should already exist from the bower processing phase
    if (!existsSync(packageJsonPath)) {
      log(`Warning: package.json not found at ${packageJsonPath}, skipping npm publish for ${packageConfig.name}`);
      return false;
    }

    // Check if user is logged in to npm
    try {
      const whoamiResult = execCommand('npm whoami', { stdio: 'pipe', cwd: bowerRepoPath });
      const npmUser = whoamiResult ? whoamiResult.toString().trim() : '';
      log(`NPM user authenticated: ${npmUser}`);
    } catch (error) {
      log(`Not logged in to npm. Attempting to login...`);

      // Attempt npm login - this will be interactive
      try {
        log(`Please complete the npm login process for ${packageConfig.name}:`);
        execCommand('npm login', { cwd: bowerRepoPath, stdio: 'inherit' });

        // Verify login was successful
        const whoamiResult = execCommand('npm whoami', { stdio: 'pipe', cwd: bowerRepoPath });
        const npmUser = whoamiResult ? whoamiResult.toString().trim() : '';
        log(`NPM login successful: ${npmUser}`);
      } catch (loginError) {
        log(`NPM login failed for ${packageConfig.name}: ${loginError.message}`);
        log(`Please run 'npm login' manually and try again`);
        return false;
      }
    }

    // Check if package already exists at this version
    try {
      const viewResult = execCommand(`npm view ${packageConfig.name}@${version} version`, { stdio: 'pipe', cwd: bowerRepoPath });
      if (viewResult && viewResult.toString().trim() === version) {
        log(`Package ${packageConfig.name}@${version} already exists on npm, skipping publish`);
        return false;
      }
    } catch (error) {
      // Package doesn't exist or other error, continue with publish
      log(`Package ${packageConfig.name}@${version} not found on npm, proceeding with publish`);
    }

    // Create .npmignore if it doesn't exist to control what gets published
    const npmIgnorePath = join(bowerRepoPath, '.npmignore');
    if (!existsSync(npmIgnorePath)) {
      const npmIgnoreContent = `# Ignore bower-specific files
bower.json
.bower.json
.git/
.gitignore
*.md
!README.md
`;
      writeFileSync(npmIgnorePath, npmIgnoreContent);
      log(`Created .npmignore for ${packageConfig.name}`);
    }

    // Publish to npm
    log(`Publishing ${packageConfig.name}@${version} to npm from ${bowerRepoPath}...`);
    execCommand('npm publish --access public', { cwd: bowerRepoPath });
    log(`Successfully published ${packageConfig.name}@${version} to npm`);

    return true;
  } catch (error) {
    log(`Error publishing ${packageConfig.name} to npm: ${error.message}`);

    // Check if it's a 2FA error and provide helpful message
    if (error.message.includes('Two-factor authentication') || error.message.includes('E403')) {
      log(`Tip: If you have 2FA enabled, you may need to:`);
      log(`  1. Use 'npm login' with an OTP token`);
      log(`  2. Or create an automation token with 'npm token create --type=automation'`);
      log(`  3. Or use 'npm publish --otp=<your-otp-code>'`);
    }

    return false;
  }
};

const main = async () => {
  try {
    log('Starting deployment process...');

    // Check for command line arguments
    const args = process.argv.slice(2);
    const skipNpm = args.includes('--skip-npm');

    if (skipNpm) {
      log('Skipping npm publishing (--skip-npm flag provided)');
    }

    // Step 1: Read version from main package.json
    const mainPackageJson = readPackageJson(join(dirname(__dirname), 'package.json'));
    const version = mainPackageJson.version;
    log(`Current version: ${version}`);

    // Step 2: Run build
    log('Building project...');
    execCommand('npm run build');

    // Step 3: Process each bower repository
    const successfulRepos = []; // Track repositories that were successfully committed and tagged
    
    for (const repo of BOWER_REPOS) {
      const bowerRepoPath = join(dirname(__dirname), '..', repo.name);

      if (!existsSync(bowerRepoPath)) {
        log(`Warning: Bower repository ${repo.name} does not exist at ${bowerRepoPath}, skipping...`);
        continue;
      }

      log(`Processing ${repo.name}...`);

      // Copy files from dist
      const distSourcePath = join(dirname(__dirname), 'dist', repo.distPath);
      const copiedCount = copyFiles(distSourcePath, bowerRepoPath, repo.files);

      if (copiedCount === 0) {
        log(`Warning: No files were copied to ${repo.name}`);
        continue;
      }

      // Update bower.json version
      const versionUpdated = updateBowerVersion(bowerRepoPath, version);

      // Create npm package.json for this bower repository
      const npmPackage = NPM_PACKAGES.find(pkg => pkg.bowerRepoName === repo.name);
      if (npmPackage) {
        createNpmPackageJson(bowerRepoPath, npmPackage.name, version, npmPackage.description);
      }

      if (versionUpdated) {
        // Commit and tag
        const commitSuccess = commitAndTag(bowerRepoPath, version, repo.name);
        if (commitSuccess) {
          successfulRepos.push(repo.name);
          log(`Successfully processed ${repo.name} for deployment`);
        } else {
          log(`Failed to commit and tag ${repo.name}, will skip npm publishing for this package`);
        }
      } else {
        log(`Skipping git operations for ${repo.name} due to bower.json update failure`);
      }
    }

    // Step 4: Publish npm packages (unless skipped)
    if (!skipNpm) {
      log('Publishing npm packages...');
      let npmPublishCount = 0;

      for (const packageConfig of NPM_PACKAGES) {
        // Only publish if the corresponding bower repository was successfully committed and tagged
        if (!successfulRepos.includes(packageConfig.bowerRepoName)) {
          log(`Skipping npm publish for ${packageConfig.name} because ${packageConfig.bowerRepoName} was not successfully committed and tagged`);
          continue;
        }

        log(`Processing npm package ${packageConfig.name}...`);
        const published = publishToNpm(packageConfig, version);
        if (published) {
          npmPublishCount++;
        }
      }

      if (npmPublishCount > 0) {
        log(`Successfully published ${npmPublishCount} npm package(s)`);
      } else {
        log('No npm packages were published');
      }
    }

    log('Deployment completed successfully!');

  } catch (error) {
    log(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the deployment
main();