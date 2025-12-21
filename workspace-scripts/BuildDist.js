import { promises as fsp } from "fs";
import { dirname } from "path";
import { minify } from "@swc/core";
import { modules } from "./config/Modules.js";

// --- config / constants ---
const DIST_DIR = new URL("./dist/", import.meta.url);
const ROOT_PKG_PATH = new URL("../package.json", import.meta.url);
const LICENSE_PATH = new URL("../LICENSE", import.meta.url);

const readJson = async (url) => JSON.parse(await fsp.readFile(url, "utf8"));
const { version } = await readJson(ROOT_PKG_PATH);

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

// --- build steps ---
const buildAllModules = async () => {
  logStep("Building all modules", "In progress");
  const licenseTemplate = await fsp.readFile(LICENSE_PATH, "utf8");

  await Promise.all(modules.map((m) => buildModule(m, licenseTemplate)));

  logStep("Building all modules", "Done ✅");
};

const buildModule = async (moduleDetails, licenseTemplate) => {
  console.log(` ↳ Building ${moduleDetails.name}: In progress ⌚`);

  const directoryPath = `dist/${moduleDetails.name}`;
  await ensureDir(directoryPath);

  const modulePackageJson = {
    ...packageJsonTemplate,
    name: moduleDetails.name,
    description: moduleDetails.description,
    main: moduleDetails.jsFiles.length === 0 ? "" : `${moduleDetails.jsFiles[0].name}.js`,
    version,
  };

  await Promise.all([
    buildModuleFiles(moduleDetails, directoryPath),
    copyModuleFiles(moduleDetails, directoryPath),
    fsp.writeFile(`${directoryPath}/package.json`, JSON.stringify(modulePackageJson, null, 4), "utf8"),
    fsp.writeFile(`${directoryPath}/LICENSE.md`, licenseTemplate, "utf8"),
  ]);

  console.log(` ↳ Building ${moduleDetails.name}: Done ✅`);
};

const buildModuleFiles = async (moduleDetails, directoryPath) => {
  const [file] = moduleDetails.jsFiles;
  if (!file) return;

  const srcContent = (await Promise.all(file.segments.map((s) => fsp.readFile(s, "utf8")))).join("");

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

