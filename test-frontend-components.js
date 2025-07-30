#!/usr/bin/env node

/**
 * 🔍 FRONTEND COMPONENTS API URL ANALYSIS
 * 
 * Automatická analýza všetkých frontend komponentov na správne API URLs
 */

const fs = require('fs');
const path = require('path');

// 🎯 Konfigurácia
const FRONTEND_DIR = 'src';
const EXPECTED_PRODUCTION_API = 'https://blackrent-app-production-4d6f.up.railway.app/api';
const EXPECTED_LOCAL_API = 'http://localhost:3001/api';

// 🔧 Helper funkcie
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  test: (msg) => console.log(`🧪 ${msg}`)
};

// 📊 Results tracking
let analysisResults = {
  filesAnalyzed: 0,
  issuesFound: 0,
  fixedComponents: 0,
  issues: []
};

// 🔍 Analyzovanie súborov
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    analysisResults.filesAnalyzed++;
    
    // Pattern checks
    const checks = [
      {
        name: 'Wrong API URL pattern',
        pattern: /process\.env\.REACT_APP_API_URL.*localhost.*3001/g,
        shouldBe: 'process.env.NODE_ENV === \'production\' ? RAILWAY_URL : LOCAL_URL'
      },
      {
        name: 'Hardcoded localhost API',
        pattern: /['"`]http:\/\/localhost:3001['"`]/g,
        shouldBe: 'Dynamic API URL based on NODE_ENV'
      },
      {
        name: 'Missing NODE_ENV check',
        pattern: /process\.env\.REACT_APP_API_BASE_URL.*\|\|.*localhost/g,
        shouldBe: 'NODE_ENV-based condition instead of fallback'
      },
      {
        name: 'Duplicate /api/ in URL',
        pattern: /api\/api\//g,
        shouldBe: 'Single /api/ prefix'
      },
      {
        name: 'UUID entity ID',
        pattern: /entityId=\{uuidv4\(\)\}/g,
        shouldBe: 'entityId={rental.id} for R2 upload'
      }
    ];
    
    checks.forEach(check => {
      const matches = content.match(check.pattern);
      if (matches) {
        analysisResults.issuesFound++;
        analysisResults.issues.push({
          file: relativePath,
          issue: check.name,
          matches: matches.length,
          shouldBe: check.shouldBe,
          lines: getLineNumbers(content, check.pattern)
        });
      }
    });
    
    // Check for correct patterns (good practices)
    const goodPatterns = [
      {
        name: 'Correct NODE_ENV check',
        pattern: /NODE_ENV === ['"`]production['"`]/g
      },
      {
        name: 'Railway API URL',
        pattern: /blackrent-app-production.*railway.*app/g
      },
      {
        name: 'Rental ID entity',
        pattern: /entityId=\{rental\.id\}/g
      }
    ];
    
    goodPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        analysisResults.fixedComponents++;
      }
    });
    
  } catch (error) {
    log.error(`Error analyzing ${filePath}: ${error.message}`);
  }
}

function getLineNumbers(content, pattern) {
  const lines = content.split('\n');
  const lineNumbers = [];
  
  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      lineNumbers.push(index + 1);
    }
  });
  
  return lineNumbers;
}

// 🔍 Rekurzívne hľadanie súborov
function findComponentFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        files.push(fullPath);
      }
    });
  }
  
  scan(dir);
  return files;
}

// 🚀 MAIN ANALYSIS
async function runAnalysis() {
  console.log('\n🔍 FRONTEND COMPONENTS API URL ANALYSIS');
  console.log('='.repeat(50));
  console.log(`📁 Analyzing directory: ${FRONTEND_DIR}`);
  console.log(`🎯 Expected Production API: ${EXPECTED_PRODUCTION_API}`);
  console.log(`🏠 Expected Local API: ${EXPECTED_LOCAL_API}`);
  console.log('='.repeat(50));
  
  if (!fs.existsSync(FRONTEND_DIR)) {
    log.error(`Frontend directory ${FRONTEND_DIR} not found!`);
    process.exit(1);
  }
  
  const componentFiles = findComponentFiles(FRONTEND_DIR);
  log.info(`Found ${componentFiles.length} TypeScript/React files`);
  
  componentFiles.forEach(analyzeFile);
  
  // 📊 Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 ANALYSIS RESULTS');
  console.log('='.repeat(50));
  console.log(`📁 Files analyzed: ${analysisResults.filesAnalyzed}`);
  console.log(`✅ Components with fixes: ${analysisResults.fixedComponents}`);
  console.log(`❌ Issues found: ${analysisResults.issuesFound}`);
  
  if (analysisResults.issues.length === 0) {
    console.log('\n🎉 NO ISSUES FOUND!');
    console.log('✅ All frontend components use correct API URL patterns.');
    console.log('✅ All components are properly configured for production.');
  } else {
    console.log('\n⚠️  ISSUES DETECTED:');
    
    // Group issues by type
    const groupedIssues = {};
    analysisResults.issues.forEach(issue => {
      if (!groupedIssues[issue.issue]) {
        groupedIssues[issue.issue] = [];
      }
      groupedIssues[issue.issue].push(issue);
    });
    
    Object.keys(groupedIssues).forEach(issueType => {
      console.log(`\n🔴 ${issueType}:`);
      groupedIssues[issueType].forEach(issue => {
        console.log(`   📄 ${issue.file} (lines: ${issue.lines.join(', ')})`);
        console.log(`   💡 Should be: ${issue.shouldBe}`);
      });
    });
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    if (groupedIssues['Wrong API URL pattern']) {
      console.log('   • Replace REACT_APP_API_URL with NODE_ENV-based logic');
    }
    if (groupedIssues['Hardcoded localhost API']) {
      console.log('   • Remove hardcoded localhost URLs');
    }
    if (groupedIssues['Duplicate /api/ in URL']) {
      console.log('   • Fix duplicate /api/ paths in URL construction');
    }
    if (groupedIssues['UUID entity ID']) {
      console.log('   • Replace uuidv4() with rental.id for R2 upload');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Quality Score: ${Math.round(((analysisResults.filesAnalyzed - analysisResults.issues.length) / analysisResults.filesAnalyzed) * 100)}%`);
  
  process.exit(analysisResults.issues.length === 0 ? 0 : 1);
}

// Execute analysis
if (require.main === module) {
  runAnalysis().catch(error => {
    console.error('💥 Analysis crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAnalysis };