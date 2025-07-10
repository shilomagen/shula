import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const fileNameArg = args.find((arg) => arg.startsWith('--file-name='));

  if (!fileNameArg) {
    return null;
  }

  return fileNameArg.split('=')[1];
}

// Get the migration file name from command line arguments
const migrationFileName = parseArgs();

if (!migrationFileName) {
  console.error('Error: No migration file specified');
  console.error('Usage: npm run migrate -- --file-name=migration-file-name');
  process.exit(1);
}

// Construct the migration file path
const migrationsDir = path.join(__dirname);
const migrationFilePath = path.join(migrationsDir, `${migrationFileName}.ts`);

// Check if the migration file exists
if (!fs.existsSync(migrationFilePath)) {
  console.error(
    `Error: Migration file '${migrationFileName}.ts' not found in ${migrationsDir}`
  );

  // List available migrations to help the user
  const availableMigrations = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.ts') && file !== 'runner.ts')
    .map((file) => file.replace('.ts', ''));

  if (availableMigrations.length > 0) {
    console.error('\nAvailable migrations:');
    availableMigrations.forEach((migration) => {
      console.error(`- ${migration}`);
    });
    console.error(
      '\nUsage: npm run migrate -- --file-name=migration-file-name'
    );
  }

  process.exit(1);
}

async function runMigration() {
  try {
    // Use require instead of import for TypeScript files
    // This works because ts-node transpiles on the fly
    const migrationModule = require(`./${migrationFileName}`);

    // Check if the migrate function exists
    if (typeof migrationModule.migrate !== 'function') {
      throw new Error(`Migration file does not export a 'migrate' function`);
    }

    // Run the migration
    console.log(`Running migration: ${migrationFileName}`);
    await migrationModule.migrate();
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
