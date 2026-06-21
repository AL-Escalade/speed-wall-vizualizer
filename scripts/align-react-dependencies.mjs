import { readFile, writeFile } from "node:fs/promises";

const packagePaths = process.argv.slice(2);
const manifests = packagePaths.length > 0 ? packagePaths : ["packages/web/package.json"];

function parseVersionRange(range) {
  const match = range.match(/^([~^]?)(\d+)\.(\d+)\.(\d+)(.*)$/);

  if (!match) {
    throw new Error(`Unsupported React dependency range: ${range}`);
  }

  return {
    prefix: match[1],
    major: Number(match[2]),
    minor: Number(match[3]),
    patch: Number(match[4]),
    suffix: match[5],
  };
}

function compareVersions(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

for (const packagePath of manifests) {
  const source = await readFile(packagePath, "utf8");
  const manifest = JSON.parse(source);
  const dependencies = manifest.dependencies ?? {};
  const reactRange = dependencies.react;
  const reactDomRange = dependencies["react-dom"];

  if (!reactRange || !reactDomRange) {
    continue;
  }

  const react = parseVersionRange(reactRange);
  const reactDom = parseVersionRange(reactDomRange);
  const target = compareVersions(react, reactDom) >= 0 ? react : reactDom;
  const targetRange = `${target.prefix}${target.major}.${target.minor}.${target.patch}${target.suffix}`;

  if (reactRange === targetRange && reactDomRange === targetRange) {
    continue;
  }

  manifest.dependencies.react = targetRange;
  manifest.dependencies["react-dom"] = targetRange;
  await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
}
