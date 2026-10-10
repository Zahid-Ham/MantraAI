import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const frontendSchemaPath = path.resolve(rootDir, 'frontend', 'src', 'data', 'assessmentSchema.js');
const sharedSchemaDir = path.resolve(rootDir, 'shared');
const sharedSchemaPath = path.resolve(sharedSchemaDir, 'assessment_schema.json');

if (!fs.existsSync(sharedSchemaDir)) {
  fs.mkdirSync(sharedSchemaDir, { recursive: true });
}

// Dynamically import the ES module
const { assessmentSchema } = await import(pathToFileURL(frontendSchemaPath).href);

fs.writeFileSync(
  sharedSchemaPath,
  JSON.stringify(assessmentSchema, null, 2),
  'utf8'
);

console.log(`Successfully converted schema to ${sharedSchemaPath}`);
console.log(`Blocks: ${assessmentSchema.blocks?.length}, Questions: ${assessmentSchema.questions?.length}`);
