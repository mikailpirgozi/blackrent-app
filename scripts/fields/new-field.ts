#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import Handlebars from 'handlebars';

// Register Handlebars helpers
Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('unless', function(conditional: any, options: any) {
  if (!conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

interface FieldConfig {
  fieldName: string;        // snake_case (e.g. extra_km_price)
  fieldLabel: string;       // Title Case (e.g. Extra KM Price)  
  table: string;           // table name (e.g. rentals, vehicles, companies)
  type: 'number' | 'string' | 'boolean' | 'enum';
  defaultValue: string;    // default value for database
  minValue?: number;       // for number types
  maxValue?: number;       // for number types
  enumValues?: string[];   // for enum types
  copyFrom?: string;       // e.g. "cars.extra_km_price" for copying during create
  description?: string;    // field description for comments
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function gatherFieldConfig(): Promise<FieldConfig> {
  console.log('🚀 BlackRent Field Scaffolder');
  console.log('============================\n');

  const fieldName = (await question('Field name (snake_case, e.g. extra_km_price): ')).trim();
  const fieldLabel = (await question('Field label (Title Case, e.g. Extra KM Price): ')).trim();
  const table = (await question('Target table (e.g. rentals, vehicles, companies): ')).trim();
  const typeInput = (await question('Field type (number/string/boolean/enum): ')).trim();
  
  const type = typeInput as FieldConfig['type'];
  if (!['number', 'string', 'boolean', 'enum'].includes(type)) {
    throw new Error('Invalid type. Must be: number, string, boolean, enum');
  }

  let defaultValue = '';
  let minValue: number | undefined;
  let maxValue: number | undefined;
  let enumValues: string[] | undefined;

  if (type === 'number') {
    defaultValue = (await question('Default value (number, e.g. 0): ')).trim();
    const minInput = (await question('Min value (optional, press Enter to skip): ')).trim();
    const maxInput = (await question('Max value (optional, press Enter to skip): ')).trim();
    
    if (minInput) minValue = parseFloat(minInput);
    if (maxInput) maxValue = parseFloat(maxInput);
  } else if (type === 'string') {
    defaultValue = (await question("Default value (string, e.g. '' or 'pending'): ")).trim();
    if (!defaultValue) defaultValue = '';
  } else if (type === 'boolean') {
    const boolDefault = (await question('Default value (true/false): ')).trim();
    defaultValue = boolDefault.toLowerCase() === 'true' ? 'true' : 'false';
  } else if (type === 'enum') {
    const enumInput = (await question('Enum values (comma-separated, e.g. pending,confirmed,cancelled): ')).trim();
    enumValues = enumInput.split(',').map(v => v.trim());
    defaultValue = (await question(`Default enum value (one of: ${enumValues.join(', ')}): `)).trim();
  }

  const copyFrom = (await question('Copy from field during create (optional, e.g. vehicles.extra_km_price): ')).trim();
  const description = (await question('Field description (optional): ')).trim();

  return {
    fieldName,
    fieldLabel,
    table,
    type,
    defaultValue,
    minValue,
    maxValue,
    enumValues,
    copyFrom: copyFrom || undefined,
    description: description || undefined
  };
}

function generateMigrationTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}

function generateFiles(config: FieldConfig): void {
  const scriptsDir = path.dirname(path.dirname(__filename)); // Get scripts/ directory
  const templatesDir = path.join(scriptsDir, 'fields', 'templates');
  const draftDir = path.join(process.cwd(), 'draft');
  
  console.log(`📁 Templates directory: ${templatesDir}`);
  console.log(`📁 Output directory: ${draftDir}`);
  
  // Ensure draft directory exists
  if (!fs.existsSync(draftDir)) {
    fs.mkdirSync(draftDir, { recursive: true });
    console.log(`✅ Created draft directory: ${draftDir}`);
  }

  // Template context
  const context = {
    ...config,
    timestamp: generateMigrationTimestamp(),
    currentDate: new Date().toISOString().split('T')[0],
    tableNameUpper: config.table.toUpperCase(),
    fieldNameCamel: toCamelCase(config.fieldName),
    fieldNamePascal: toPascalCase(config.fieldName),
    sqlType: getSqlType(config),
    tsType: getTsType(config),
    zodSchema: getZodSchema(config),
    checkConstraint: getCheckConstraint(config)
  };

  console.log(`🔧 Template context:`, JSON.stringify(context, null, 2));

  // Generate all template files
  const templates = [
    'migration.up.sql.hbs',
    'migration.down.sql.hbs', 
    'dto.ts.hbs',
    'service.test.ts.hbs',
    'ui-input.tsx.hbs',
    'api-snippets.md.hbs',
    'readme.md.hbs'
  ];

  templates.forEach(template => {
    const templatePath = path.join(templatesDir, template);
    const outputPath = path.join(draftDir, template.replace('.hbs', ''));
    
    console.log(`🔍 Checking template: ${templatePath}`);
    
    if (fs.existsSync(templatePath)) {
      try {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const compiledTemplate = Handlebars.compile(templateContent);
        const output = compiledTemplate(context);
        
        fs.writeFileSync(outputPath, output);
        console.log(`✅ Generated: ${outputPath}`);
      } catch (error) {
        console.error(`❌ Error generating ${template}:`, error);
      }
    } else {
      console.warn(`⚠️ Template not found: ${templatePath}`);
    }
  });

  console.log(`\n🎉 Field scaffolding completed!`);
  console.log(`📁 Files generated in: ${draftDir}`);
  console.log(`📖 Next steps: Check draft/readme.md for implementation guide`);
}

// Helper functions
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str: string): string {
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

function getSqlType(config: FieldConfig): string {
  switch (config.type) {
    case 'number':
      return 'DECIMAL(12,2)';
    case 'string':
      return 'VARCHAR(255)';
    case 'boolean':
      return 'BOOLEAN';
    case 'enum':
      return `${config.fieldName}_enum`;
    default:
      return 'VARCHAR(255)';
  }
}

function getTsType(config: FieldConfig): string {
  switch (config.type) {
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'enum':
      return `'${config.enumValues?.join("' | '")}'`;
    default:
      return 'string';
  }
}

function getZodSchema(config: FieldConfig): string {
  switch (config.type) {
    case 'number':
      let schema = 'z.number()';
      if (config.minValue !== undefined) schema += `.min(${config.minValue})`;
      if (config.maxValue !== undefined) schema += `.max(${config.maxValue})`;
      return schema;
    case 'string':
      return 'z.string().min(1)';
    case 'boolean':
      return 'z.boolean()';
    case 'enum':
      return `z.enum(['${config.enumValues?.join("', '")}'])`;
    default:
      return 'z.string()';
  }
}

function getCheckConstraint(config: FieldConfig): string {
  switch (config.type) {
    case 'number':
      if (config.minValue !== undefined) {
        return `CHECK (${config.fieldName} >= ${config.minValue})`;
      }
      return '';
    case 'boolean':
      return '';
    case 'enum':
      return `CHECK (${config.fieldName} IN ('${config.enumValues?.join("', '")}'))`;
    default:
      return '';
  }
}

// Main execution
async function main() {
  try {
    const config = await gatherFieldConfig();
    
    console.log('\n📋 Field Configuration:');
    console.log(JSON.stringify(config, null, 2));
    
    const confirm = await question('\nGenerate files? (y/n): ');
    rl.close();
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      generateFiles(config);
    } else {
      console.log('❌ Generation cancelled');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

main();
