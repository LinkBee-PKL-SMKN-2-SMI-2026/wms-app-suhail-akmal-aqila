import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse, stringify } from "yaml";

const SPEC_DIR = resolve("docs/spec");
const OUTPUT_DIR = resolve("docs/bundle");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "openapi.yaml");

// Jalankan via process.execPath (binary bun) + path absolut ke CLI lokal,
// jadi tidak ada shell & PATH lookup -> aman di Windows/Linux/macOS.
const REDOCLY_CLI = resolve("node_modules", "@redocly", "cli", "bin", "cli.js");

function findSpecFiles(): string[] {
  return readdirSync(SPEC_DIR)
    .filter((entry) => statSync(resolve(SPEC_DIR, entry)).isDirectory())
    .map((dir) => resolve(SPEC_DIR, dir, "openapi.yaml"))
    .filter((file) => existsSync(file));
}

function runRedocly(args: string[]): void {
  const result = spawnSync(process.execPath, [REDOCLY_CLI, ...args], { stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status}`);
  }
}

function lintSpecs(files: string[]): void {
  for (const file of files) {
    console.log(`  Linting: ${file}`);
    try {
      runRedocly(["lint", file, "--format=stylish"]);
    } catch {
      console.error(`  Lint failed for: ${file}`);
      process.exit(1);
    }
  }
}

function joinSpecs(files: string[]): void {
  const singleFile = files.length === 1 ? files[0] : undefined;

  if (singleFile) {
    console.log(`  Copying spec to ${OUTPUT_FILE}`);
    copyFileSync(singleFile, OUTPUT_FILE);
    return;
  }
  console.log(`  Joining ${files.length} specs into ${OUTPUT_FILE}`);
  runRedocly([
    "join",
    ...files,
    "--output",
    OUTPUT_FILE,
    "--without-x-tag-groups",
    "--prefix-components-with-info-prop",
    "title",
  ]);
}

// Timpa servers di hasil bundle dari env PORT (Bun auto-load .env),
// supaya target request "Try it" di UI docs selalu sinkron dengan port API.
function injectServers(): void {
  const port = process.env.PORT || "3000";
  const doc = parse(readFileSync(OUTPUT_FILE, "utf8")) as Record<string, unknown>;

  doc.servers = [
    {
      url: `http://localhost:${port}/api`,
      description: "Local development",
    },
  ];

  writeFileSync(OUTPUT_FILE, stringify(doc));
  console.log(`  Injected servers: http://localhost:${port}/api`);
}

function main(): void {
  console.log("📦 Bundle Docs\n");

  if (!existsSync(SPEC_DIR)) {
    console.error(`Spec directory not found: ${SPEC_DIR}`);
    process.exit(1);
  }

  if (!existsSync(REDOCLY_CLI)) {
    console.error("Redocly CLI not found. Run `bun install` first.");
    process.exit(1);
  }

  const specFiles = findSpecFiles();

  if (specFiles.length === 0) {
    console.error(`No spec files found in ${SPEC_DIR}/**/openapi.yaml`);
    process.exit(1);
  }

  console.log(`Found ${specFiles.length} spec(s):\n`);
  for (const f of specFiles) {
    console.log(`  - ${f.replace(process.cwd(), ".")}`);
  }

  lintSpecs(specFiles);
  joinSpecs(specFiles);
  injectServers();

  console.log(`\n✅ Bundle complete: ${OUTPUT_FILE.replace(process.cwd(), ".")}`);
}

main();
