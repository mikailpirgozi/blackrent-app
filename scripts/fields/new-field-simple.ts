#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

// Register Handlebars helpers
Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

interface FieldConfig {
  fieldName: string;
  fieldLabel: string;
  table: string;
  type: 'number' | 'string' | 'boolean' | 'enum';
  defaultValue: string;
  minValue?: number;
  maxValue?: number;
  enumValues?: string[];
  copyFrom?: string;
  description?: string;
}

// Get config from command line args or use demo
function getFieldConfig(): FieldConfig {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Demo config for testing
    return {
      fieldName: 'extra_km_price',
      fieldLabel: 'Extra KM Price',
      table: 'vehicles',
      type: 'number',
      defaultValue: '0',
      minValue: 0,
      maxValue: 100,
      copyFrom: 'vehicles.extra_km_price',
      description: 'Price per extra kilometer'
    };
  }
  
  // Parse from args: field_name,Field Label,table,type,default,min,max,copyFrom,description
  const [fieldName, fieldLabel, table, type, defaultValue, minStr, maxStr, copyFrom, description] = args;
  
  return {
    fieldName,
    fieldLabel,
    table,
    type: type as FieldConfig['type'],
    defaultValue,
    minValue: minStr ? parseFloat(minStr) : undefined,
    maxValue: maxStr ? parseFloat(maxStr) : undefined,
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

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str: string): string {
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

function getSqlType(config: FieldConfig): string {
  switch (config.type) {
    case 'number': return 'DECIMAL(12,2)';
    case 'string': return 'VARCHAR(255)';
    case 'boolean': return 'BOOLEAN';
    case 'enum': return `${config.fieldName}_enum`;
    default: return 'VARCHAR(255)';
  }
}

function getTsType(config: FieldConfig): string {
  switch (config.type) {
    case 'number': return 'number';
    case 'string': return 'string';
    case 'boolean': return 'boolean';
    case 'enum': return `'${config.enumValues?.join("' | '")}'`;
    default: return 'string';
  }
}

function getZodSchema(config: FieldConfig): string {
  switch (config.type) {
    case 'number':
      let schema = 'z.number()';
      if (config.minValue !== undefined) schema += `.min(${config.minValue})`;
      if (config.maxValue !== undefined) schema += `.max(${config.maxValue})`;
      return schema;
    case 'string': return 'z.string().min(1)';
    case 'boolean': return 'z.boolean()';
    case 'enum': return `z.enum(['${config.enumValues?.join("', '")}'])`;
    default: return 'z.string()';
  }
}

function getCheckConstraint(config: FieldConfig): string {
  switch (config.type) {
    case 'number':
      if (config.minValue !== undefined) {
        return `CHECK (${config.fieldName} >= ${config.minValue})`;
      }
      return '';
    case 'enum':
      return `CHECK (${config.fieldName} IN ('${config.enumValues?.join("', '")}'))`;
    default:
      return '';
  }
}

function generateFiles(config: FieldConfig): void {
  const currentDir = process.cwd();
  const templatesDir = path.join(currentDir, 'scripts', 'fields', 'templates');
  const draftDir = path.join(currentDir, 'draft');
  
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

  let generatedCount = 0;

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
        generatedCount++;
      } catch (error) {
        console.error(`❌ Error generating ${template}:`, error);
      }
    } else {
      console.warn(`⚠️ Template not found: ${templatePath}`);
    }
  });

  console.log(`\n🎉 Field scaffolding completed!`);
  console.log(`📊 Generated ${generatedCount}/${templates.length} files`);
  console.log(`📁 Files generated in: ${draftDir}`);
  console.log(`📖 Next steps: Check draft/readme.md for implementation guide`);
}

// Main execution
function main() {
  try {
    console.log('🚀 BlackRent Field Scaffolder (Simple Mode)');
    console.log('==========================================\n');

    const config = getFieldConfig();
    
    console.log('📋 Field Configuration:');
    console.log(JSON.stringify(config, null, 2));
    console.log('');
    
    generateFiles(config);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
