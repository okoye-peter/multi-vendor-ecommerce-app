import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const schemaDir = "./prisma/schema";
const outputFile = "./prisma/generated-schema.prisma";

// Read the main schema (with generator and datasource)
const mainSchemaPath = join(schemaDir, "schema.prisma");
let combinedSchema = readFileSync(mainSchemaPath, "utf-8");

// Read all other .prisma files in the schema directory
const files = readdirSync(schemaDir)
  .filter((file) => file.endsWith(".prisma") && file !== "schema.prisma")
  .sort(); // Sort for consistent ordering

// Append each model file
for (const file of files) {
  const filePath = join(schemaDir, file);
  const content = readFileSync(filePath, "utf-8");
  combinedSchema += "\n\n// From " + file + "\n" + content;
}

// Write the combined schema
writeFileSync(outputFile, combinedSchema);
console.log(`✅ Combined ${files.length + 1} schema files into ${outputFile}`);
