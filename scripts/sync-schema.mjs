import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const sharedSchemaPath = path.resolve(rootDir, 'shared', 'assessment_schema.json');
const frontendPath = path.resolve(rootDir, 'frontend', 'src', 'data', 'assessmentSchema.js');
const mobilePath = path.resolve(rootDir, 'mobile', 'src', 'data', 'assessmentSchema.js');

if (!fs.existsSync(sharedSchemaPath)) {
  console.error(`Error: shared schema not found at ${sharedSchemaPath}`);
  process.exit(1);
}

const rawJson = fs.readFileSync(sharedSchemaPath, 'utf8');
const parsed = JSON.parse(rawJson);

const header = `// Generated automatically from shared/assessment_schema.json by scripts/sync-schema.mjs
// DO NOT EDIT DIRECTLY. Modify shared/assessment_schema.json and run 'node scripts/sync-schema.mjs'.

export const assessmentSchema = ${JSON.stringify(parsed, null, 2)};
`;

fs.writeFileSync(frontendPath, header, 'utf8');
console.log(`Synced: ${frontendPath}`);

fs.writeFileSync(mobilePath, header, 'utf8');
console.log(`Synced: ${mobilePath}`);

console.log(`Successfully synced schema (${parsed.questions?.length} questions, ${parsed.blocks?.length} blocks).`);
