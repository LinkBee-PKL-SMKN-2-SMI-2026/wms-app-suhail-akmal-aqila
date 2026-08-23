import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const SPEC_DIR = resolve("docs/spec");
const OUTPUT_DIR = resolve("docs/bundle");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "openapi.yaml");

function findSpecFiles(): string[] {
  return readdirSync(SPEC_DIR)
    .filter((entry) => statSync(resolve(SPEC_DIR, entry)).isDirectory())
    .map((dir) => resolve(SPEC_DIR, dir, "openapi.yaml"))
    .filter((file) => existsSync(file));
}

function lintSpecs(files: string[]): void {
  for (const file of files) {
    console.log(`   Linting: ${file}`);
    try {
      execSync(`bunx redocly lint "${file}" --format=stylish`, {
        stdio: "inherit",
      });
    } catch {
      console.error(`   Lint failed for: ${file}`);
      process.exit(1);
    }
  }
}

function joinSpecs(files: string[]): void {
  // Pastikan folder output docs/bundle sudah ada
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (files.length === 1) {
    console.log(`   Copying spec to ${OUTPUT_FILE}`);
    // Menggunakan copyFileSync bawaan node:fs (Aman untuk Windows, Mac, & Linux)
    copyFileSync(files[0]!, OUTPUT_FILE);
    return;
  }
  console.log(`   Joining ${files.length} specs into ${OUTPUT_FILE}`);
  const fileArgs = files.map((f) => `"${f}"`).join(" ");
  execSync(
    `bunx redocly join ${fileArgs} --output "${OUTPUT_FILE}" --without-x-tag-groups --prefix-components-with-info-prop title`,
    { stdio: "inherit" },
  );
}

function main(): void {
  console.log("📦 Bundle Docs\n");

  if (!existsSync(SPEC_DIR)) {
    console.error(`Spec directory not found: ${SPEC_DIR}`);
    process.exit(1);
  }

  const specFiles = findSpecFiles();

  if (specFiles.length === 0) {
    console.error(`No spec files found in ${SPEC_DIR}/**/openapi.yaml`);
    process.exit(1);
  }

  console.log(`Found ${specFiles.length} spec(s):\n`);
  for (const f of specFiles) {
    console.log(`   - ${f.replace(process.cwd(), ".")}`);
  }

  lintSpecs(specFiles);
  joinSpecs(specFiles);

  console.log(`\n✅ Bundle complete: ${OUTPUT_FILE.replace(process.cwd(), ".")}`);
}

main();