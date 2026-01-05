#!/usr/bin/env node

import { execSync } from 'child_process';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  readdirSync
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/* -------------------------------------------------------------------------- */
/*  Paths & Globals                                                            */
/* -------------------------------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);

/* -------------------------------------------------------------------------- */
/*  Configuration                                                              */
/* -------------------------------------------------------------------------- */

const BOWER_REPOS = [
  {
    name: 'bower-angular-lts',
    packageName: 'angular-lts',
    distPath: 'angular',
    files: ['angular.js', 'angular.min.js', 'angular.min.js.map'],
    additionalFiles: ['angular-csp.css']
  },
  {
    name: 'bower-angular-animate-lts',
    packageName: 'angular-animate-lts',
    distPath: 'angular-animate',
    files: ['angular-animate.js', 'angular-animate.min.js', 'angular-animate.min.js.map']
  },
  {
    name: 'bower-angular-aria-lts',
    packageName: 'angular-aria-lts',
    distPath: 'angular-aria',
    files: ['angular-aria.js', 'angular-aria.min.js', 'angular-aria.min.js.map']
  },
  {
    name: 'bower-angular-cookies-lts',
    packageName: 'angular-cookies-lts',
    distPath: 'angular-cookies',
    files: ['angular-cookies.js', 'angular-cookies.min.js', 'angular-cookies.min.js.map']
  },
  {
    name: 'bower-angular-i18n-lts',
    pacageName: 'angular-i18n-lts',
    distPath: 'angular-i18n',
    files: ['*.js']
  },
  {
    name: 'bower-angular-loader-lts',
    packageName: 'angular-loader-lts',
    distPath: 'angular-loader',
    files: ['angular-loader.js', 'angular-loader.min.js', 'angular-loader.min.js.map']
  },
  {
    name: 'bower-angular-message-format-lts',
    packageName: 'angular-message-format-lts',
    distPath: 'angular-message-format',
    files: ['angular-message-format.js', 'angular-message-format.min.js', 'angular-message-format.min.js.map']
  },
  {
    name: 'bower-angular-messages-lts',
    packageName: 'angular-messages-lts',
    distPath: 'angular-messages',
    files: ['angular-messages.js', 'angular-messages.min.js', 'angular-messages.min.js.map']
  },
  {
    name: 'bower-angular-mocks-lts',
    packageName: 'angular-mocks-lts',
    distPath: 'angular-mocks',
    files: ['angular-mocks.js', 'angular-mocks.min.js', 'angular-mocks.min.js.map']
  },
  {
    name: 'bower-angular-parse-ext-lts',
    packageName: 'angular-parse-ext-lts',
    distPath: 'angular-parse-ext',
    files: ['angular-parse-ext.js', 'angular-parse-ext.min.js', 'angular-parse-ext.min.js.map']
  },
  {
    name: 'bower-angular-resource-lts',
    pacageName: 'angular-resource-lts',
    distPath: 'angular-resource',
    files: ['angular-resource.js', 'angular-resource.min.js', 'angular-resource.min.js.map']
  },
  {
    name: 'bower-angular-route-lts',
    packageName: 'bower-angular-route-lts',
    distPath: 'angular-route',
    files: ['angular-route.js', 'angular-route.min.js', 'angular-route.min.js.map']
  },
  {
    name: 'bower-angular-sanitize-lts',
    packageName: 'angular-sanitize-lts',
    distPath: 'angular-sanitize',
    files: ['angular-sanitize.js', 'angular-sanitize.min.js', 'angular-sanitize.min.js.map']
  },
  {
    name: 'bower-angular-touch-lts',
    pacageName: 'angular-touch-lts',
    distPath: 'angular-touch',
    files: ['angular-touch.js', 'angular-touch.min.js', 'angular-touch.min.js.map']
  }
];

const NPM_PACKAGES = [
  {
    name: 'angular-lts',
    bowerRepoName: 'bower-angular-lts',
    description: 'AngularJS LTS (Long Term Support) - HTML enhanced for web apps'
  },
  {
    name: 'angular-animate-lts',
    bowerRepoName: 'bower-angular-animate-lts',
    description: 'AngularJS Animate LTS (Long Term Support) - AngularJS module for animations'
  },
  {
    name: 'angular-aria-lts',
    bowerRepoName: 'bower-angular-aria-lts',
    description: 'AngularJS Aria LTS (Long Term Support) - AngularJS module for accessibility'
  },
  {
    name: 'angular-cookies-lts',
    bowerRepoName: 'bower-angular-cookies-lts',
    description: 'AngularJS Cookies LTS (Long Term Support) - AngularJS module for cookie management'
  },
  {
    name: 'angular-i18n-lts',
    bowerRepoName: 'bower-angular-i18n-lts',
    description: 'AngularJS i18n LTS (Long Term Support) - AngularJS internationalization files'
  },
  {
    name: 'angular-loader-lts',
    bowerRepoName: 'bower-angular-loader-lts',
    description: 'AngularJS Loader LTS (Long Term Support) - AngularJS module loader'
  },
  {
    name: 'angular-message-format-lts',
    bowerRepoName: 'bower-angular-message-format-lts',
    description: 'AngularJS Message Format LTS (Long Term Support) - AngularJS module for message formatting'
  },
  {
    name: 'angular-messages-lts',
    bowerRepoName: 'bower-angular-messages-lts',
    description: 'AngularJS Messages LTS (Long Term Support) - AngularJS module for form validation messages'
  },
  {
    name: 'angular-mocks-lts',
    bowerRepoName: 'bower-angular-mocks-lts',
    description: 'AngularJS Mocks LTS (Long Term Support) - AngularJS module for testing'
  },
  {
    name: 'angular-parse-ext-lts',
    bowerRepoName: 'bower-angular-parse-ext-lts',
    description: 'AngularJS Parse Extensions LTS (Long Term Support) - AngularJS parser extensions'
  },
  {
    name: 'angular-resource-lts',
    bowerRepoName: 'bower-angular-resource-lts',
    description: 'AngularJS Resource LTS (Long Term Support) - AngularJS module for interacting with RESTful server-side data sources'
  },
  {
    name: 'angular-route-lts',
    bowerRepoName: 'bower-angular-route-lts',
    description: 'AngularJS Route LTS (Long Term Support) - AngularJS module for routing'
  },
  {
    name: 'angular-sanitize-lts',
    bowerRepoName: 'bower-angular-sanitize-lts',
    description: 'AngularJS Sanitize LTS (Long Term Support) - AngularJS module for sanitizing HTML'
  },
  {
    name: 'angular-touch-lts',
    bowerRepoName: 'bower-angular-touch-lts',
    description: 'AngularJS Touch LTS (Long Term Support) - AngularJS module for touch events'
  }
];

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const log = msg => console.log(`[DEPLOY] ${msg}`);

const execCommand = (cmd, opts = {}) => {
  log(`Executing: ${cmd}`);
  return execSync(cmd, {
    stdio: opts.stdio ?? 'inherit',
    cwd: opts.cwd ?? ROOT_DIR,
    ...opts
  });
};

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));

const writeJson = (path, data) => {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  log(`Updated ${path}`);
};

/* -------------------------------------------------------------------------- */
/*  File Copy                                                                  */
/* -------------------------------------------------------------------------- */

const copyFiles = (srcDir, destDir, files) => {
  let copied = 0;

  for (const file of files) {
    if (file === '*.js') {
      try {
        const jsFiles = readdirSync(srcDir).filter(f => f.endsWith('.js'));
        for (const f of jsFiles) {
          copyFileSync(join(srcDir, f), join(destDir, f));
          copied++;
        }
        if (jsFiles.length) {
          log(`Copied ${jsFiles.length} i18n files to ${destDir}`);
        }
      } catch (err) {
        log(`Warning: Failed reading ${srcDir}: ${err.message}`);
      }
      continue;
    }

    const src = join(srcDir, file);
    const dest = join(destDir, file);

    if (!existsSync(src)) {
      log(`Warning: Source file ${src} does not exist`);
      continue;
    }

    try {
      copyFileSync(src, dest);
      log(`Copied ${file} to ${destDir}`);
      copied++;
    } catch (err) {
      log(`Warning: Failed to copy ${file}: ${err.message}`);
    }
  }

  return copied;
};

/* -------------------------------------------------------------------------- */
/*  Versioning                                                                 */
/* -------------------------------------------------------------------------- */

const compareVersions = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);

  while (pa.length < len) pa.push(0);
  while (pb.length < len) pb.push(0);

  for (let i = 0; i < len; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
};

const checkDeployedVersion = (repoPath, version) => {
  if (!existsSync(repoPath)) return false;

  try {
    const tags = execCommand('git tag --sort=-version:refname', {
      cwd: repoPath,
      stdio: 'pipe'
    })
      .toString()
      .split('\n')
      .filter(t => t.startsWith('v'));

    if (!tags.length) return false;

    const latest = tags[0].slice(1);
    const cmp = compareVersions(latest, version);

    if (cmp >= 0) {
      log(`Deployed version ${latest} >= ${version}, skipping`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  JSON Updates                                                               */
/* -------------------------------------------------------------------------- */

const updateBowerVersion = (repoPath, name, version) => {
  const path = join(repoPath, 'bower.json');
  if (!existsSync(path)) return false;

  try {
    const json = readJson(path);
    json.version = version;
    json.name = name;

    if (json.dependencies?.angular) {
      json.dependencies.angular = version;
    }

    writeJson(path, json);
    return true;
  } catch {
    return false;
  }
};

const updateNpmPackageJson = (repoPath, name, version, description) => {
  const path = join(repoPath, 'package.json');
  if (!existsSync(path)) return false;

  const pkg = readJson(path);
  pkg.name = name;
  pkg.version = version;
  pkg.description = description;

  pkg.license ??= 'MIT';
  pkg.author ??= 'Angular Core Team <angular-core+npm@google.com>';
  pkg.contributors ??= ['Thomas Stone <stone.tj.99@hotmail.co.uk>'];
  pkg.repository ??= {
    type: 'git',
    url: 'https://github.com/TJSTONE99/angular.js-lts.git'
  };
  pkg.keywords ??= ['lts', 'angularjs', 'angular'];

  if (name !== 'angular-lts') {
    pkg.peerDependencies = { 'angular-lts': version };
  }

  writeJson(path, pkg);
  return true;
};

/* -------------------------------------------------------------------------- */
/*  Git                                                                        */
/* -------------------------------------------------------------------------- */

const commitAndTag = (repoPath, version, name) => {
  const tag = `v${version}`;

  try {
    const remoteTag = execCommand(`git ls-remote --tags origin ${tag}`, {
      cwd: repoPath,
      stdio: 'pipe'
    }).toString().trim();

    if (remoteTag) {
      log(`Tag ${tag} already exists remotely for ${name}`);
      return false;
    }

    const hasChanges =
      execCommand('git diff --name-only', { cwd: repoPath, stdio: 'pipe' }).toString().trim() ||
      execCommand('git diff --cached --name-only', { cwd: repoPath, stdio: 'pipe' }).toString().trim() ||
      execCommand('git ls-files --others --exclude-standard', { cwd: repoPath, stdio: 'pipe' }).toString().trim();

    if (!hasChanges) return false;

    execCommand('git add .', { cwd: repoPath });
    execCommand(`git commit -m "Release version ${version}"`, { cwd: repoPath });

    try {
      execCommand(`git tag -d ${tag}`, { cwd: repoPath, stdio: 'pipe' });
    } catch { }

    execCommand(`git tag ${tag}`, { cwd: repoPath });
    execCommand('git push origin HEAD', { cwd: repoPath });
    execCommand(`git push origin ${tag}`, { cwd: repoPath });

    return true;
  } catch {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  NPM                                                                        */
/* -------------------------------------------------------------------------- */

const publishToNpm = (pkg, version) => {
  const repoPath = join(ROOT_DIR, '..', pkg.bowerRepoName);
  if (!existsSync(repoPath)) return false;

  try {
    try {
      execCommand('npm whoami', { cwd: repoPath, stdio: 'pipe' });
    } catch {
      execCommand('npm login', { cwd: repoPath });
    }

    try {
      const existing = execCommand(`npm view ${pkg.name}@${version} version`, {
        cwd: repoPath,
        stdio: 'pipe'
      }).toString().trim();

      if (existing === version) return false;
    } catch { }

    const ignorePath = join(repoPath, '.npmignore');
    if (!existsSync(ignorePath)) {
      writeFileSync(
        ignorePath,
        `bower.json\n.bower.json\n.git/\n.gitignore\n*.md\n!README.md\n`
      );
    }

    execCommand('npm publish --access public', { cwd: repoPath });
    return true;
  } catch {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

const main = async () => {
  log('Starting deployment process');

  const skipNpm = process.argv.includes('--skip-npm');

  const { version } = readJson(join(ROOT_DIR, 'package.json'));
  log(`Current version: ${version}`);

  execCommand('npm run build');

  const successful = [];

  for (const repo of BOWER_REPOS) {
    const repoPath = join(ROOT_DIR, '..', repo.name);

    if (checkDeployedVersion(repoPath, version)) continue;
    if (!existsSync(repoPath)) continue;

    const distPath = join(ROOT_DIR, 'dist', repo.distPath);
    if (!copyFiles(distPath, repoPath, repo.files)) continue;

    if (!updateBowerVersion(repoPath, repo.packageName, version)) continue;

    const npmCfg = NPM_PACKAGES.find(p => p.bowerRepoName === repo.name);
    if (npmCfg) {
      updateNpmPackageJson(repoPath, npmCfg.name, version, npmCfg.description);
    }

    if (commitAndTag(repoPath, version, repo.name)) {
      successful.push(repo.name);
    }
  }

  if (!skipNpm) {
    for (const pkg of NPM_PACKAGES) {
      if (successful.includes(pkg.bowerRepoName)) {
        publishToNpm(pkg, version);
      }
    }
  }

  log('Deployment completed successfully');
};

main();
