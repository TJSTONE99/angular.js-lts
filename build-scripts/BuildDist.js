import { promises as fsp } from "fs";
import { dirname } from "path";
import { minify } from "@swc/core";
import { modules } from "./config/Modules.js";

// --- config / constants ---
const BUILD_FOR_TEST_ENV = process.argv.slice(2).some((a) => a === "--test");
const OP_KEY = BUILD_FOR_TEST_ENV ? "test" : "dist";
const DIST_DIR = BUILD_FOR_TEST_ENV
  ? new URL(`../${OP_KEY}/.build/`, import.meta.url)
  : new URL(`../${OP_KEY}/`, import.meta.url);
const ROOT_PKG_PATH = new URL("../package.json", import.meta.url);
const LICENSE_PATH = new URL("../LICENSE", import.meta.url);

const readJson = async (url) => JSON.parse(await fsp.readFile(url, "utf8"));
const { version } = await readJson(ROOT_PKG_PATH);

const angularVersion = {
  full: version,
  major: version.split(".")[0],
  minor: version.split(".")[1],
  dot: version.split(".")[2],
  codeName: "lts"
};

const VERSION_REPLACEMENTS = {
  '"NG_VERSION_FULL"': angularVersion.full,
  "'NG_VERSION_MAJOR'": angularVersion.major,
  "'NG_VERSION_MINOR'": angularVersion.minor,
  "'NG_VERSION_DOT'": angularVersion.dot,
  '"NG_VERSION_CODENAME"': angularVersion.codeName,
};

const packageJsonTemplate = Object.freeze({
  name: "",
  description: "",
  version: "",
  license: "MIT",
  author: "Angular Core Team <angular-core+npm@google.com>",
  contributors: ["Thomas Stone <stone.tj.99@hotmail.co.uk>"],
  repository: {
    type: "git",
    url: "https://github.com/TJSTONE99/angular.js-lts.git",
  },
  main: "",
});

// --- utils ---
const logStep = (msg, status) => console.log(`${msg}: ${status}`);

const cleanupDist = async () => {
  logStep("Cleaning up previous build", "In progress ⌚");
  await fsp.rm(DIST_DIR, { force: true, recursive: true });
  logStep("Cleaning up previous build", "Done ✅");
};

const ensureDir = async (path) => {
  await fsp.mkdir(path, { recursive: true });
};

const isFilePath = (p) => /\.[a-z0-9]{1,20}$/i.test(p);

const copyFileEnsuringDir = async (sourcePath, destinationPath) => {
  try {
    await fsp.copyFile(sourcePath, destinationPath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await fsp.mkdir(dirname(destinationPath), { recursive: true });
    await fsp.copyFile(sourcePath, destinationPath);
  }
};

const replaceVersionPlaceholders = (source) => {
  let result = source;

  for (const [needle, replacement] of Object.entries(VERSION_REPLACEMENTS)) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "g"), replacement);
  }

  return result;
};

// --- build steps ---
const buildAllModules = async () => {
  logStep("Building all modules", "In progress");
  const licenseTemplate = await fsp.readFile(LICENSE_PATH, "utf8");

  await Promise.all(modules.map((m) => buildModule(m, licenseTemplate)));

  logStep("Building all modules", "Done ✅");
};

const buildModule = async (moduleDetails, licenseTemplate) => {
  console.log(` ↳ Building ${moduleDetails.name}: In progress ⌚`);

  const directoryPath = `${DIST_DIR.pathname}/${moduleDetails.name}`;
  await ensureDir(directoryPath);

  const modulePackageJson = {
    ...packageJsonTemplate,
    name: moduleDetails.name,
    description: moduleDetails.description,
    main:
      moduleDetails.jsFiles.length === 0
        ? ""
        : `${moduleDetails.jsFiles[0].name}.js`,
    version,
  };

  await Promise.all([
    buildModuleFiles(moduleDetails, directoryPath),
    copyModuleFiles(moduleDetails, directoryPath),
    fsp.writeFile(
      `${directoryPath}/package.json`,
      JSON.stringify(modulePackageJson, null, 4),
      "utf8"
    ),
    fsp.writeFile(`${directoryPath}/LICENSE.md`, licenseTemplate, "utf8"),
  ]);

  console.log(` ↳ Building ${moduleDetails.name}: Done ✅`);
};

const buildModuleFiles = async (moduleDetails, directoryPath) => {
  const [file] = moduleDetails.jsFiles;
  if (!file) return;

  const segments = file.segments;

  if (file.prefix[OP_KEY] !== null) {
    segments.unshift(file.prefix[OP_KEY]);
  }

  if (file.suffix[OP_KEY] !== null) {
    segments.push(file.suffix[OP_KEY]);
  }

  const rawContent = (
    await Promise.all(segments.map((s) => fsp.readFile(s, "utf8")))
  ).join("");

  const srcContent = BUILD_FOR_TEST_ENV ? rawContent : replaceVersionPlaceholders(rawContent);

  const minified = await minify(srcContent, {
    format: { comments: "some" },
    module: Boolean(file.module),
    sourceMap: true,
    ...file.minify,
  });

  const baseFilename = `${directoryPath}/${file.name}`;
  await Promise.all([
    fsp.writeFile(`${baseFilename}.js`, srcContent, "utf8"),
    fsp.writeFile(`${baseFilename}.min.js`, minified.code, "utf8"),
    fsp.writeFile(`${baseFilename}.min.js.map`, minified.map, "utf8"),
  ]);
};

const copyModuleFiles = (moduleDetails, directoryPath) =>
  Promise.all(
    moduleDetails.copy.map(({ from, to }) => {
      const destination = `${directoryPath}/${to}`;
      return isFilePath(from)
        ? copyFileEnsuringDir(from, destination)
        : fsp.cp(from, destination, { force: true, recursive: true });
    })
  );

// --- run ---
await cleanupDist();
await buildAllModules();
