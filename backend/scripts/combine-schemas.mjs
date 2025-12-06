import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PRISMA_DIR = path.join(ROOT, "prisma");
const MODELS_DIR = path.join(PRISMA_DIR, "models");

const BASE_SCHEMA = path.join(PRISMA_DIR, "base.prisma");
const OUTPUT_SCHEMA = path.join(PRISMA_DIR, "schema.prisma");

function combineSchemas() {
  if (!fs.existsSync(BASE_SCHEMA)) {
    throw new Error("❌ prisma/base.prisma not found");
  }

  const baseSchema = fs.readFileSync(BASE_SCHEMA, "utf-8");

  if (!fs.existsSync(MODELS_DIR)) {
    throw new Error("❌ prisma/models directory not found");
  }

  const modelFiles = fs
    .readdirSync(MODELS_DIR)
    .filter((file) => file.endsWith(".prisma"));

  if (modelFiles.length === 0) {
    throw new Error("❌ No model files found in prisma/models");
  }

  const models = modelFiles
    .map((file) => {
      const content = fs.readFileSync(
        path.join(MODELS_DIR, file),
        "utf-8"
      );

      return `\n// ===== ${file} =====\n${content.trim()}\n`;
    })
    .join("\n");

  const finalSchema = `${baseSchema.trim()}\n\n${models}`;

  fs.writeFileSync(OUTPUT_SCHEMA, finalSchema);

  console.log("✅ Prisma schema successfully combined!");
}

combineSchemas();
