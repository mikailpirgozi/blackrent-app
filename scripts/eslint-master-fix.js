#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 BLACKRENT ESLint Master Fix - Kompletné automatické opravovanie');
console.log('====================================================================');

// Utility funkcie
function getESLintStats() {
  try {
    const result = execSync('npx eslint . --ext .ts,.tsx --format json 2>/dev/null', { encoding: 'utf8' });
    const data = JSON.parse(result);
    const totalFiles = data.filter(f => f.messages.length > 0).length;
    const totalErrors = data.reduce((sum, f) => sum + f.messages.length, 0);
    return { totalFiles, totalErrors, success: true };
  } catch (error) {
    if (error.stdout) {
      const data = JSON.parse(error.stdout);
      const totalFiles = data.filter(f => f.messages.length > 0).length;
      const totalErrors = data.reduce((sum, f) => sum + f.messages.length, 0);
      return { totalFiles, totalErrors, success: false };
    }
    return { totalFiles: 0, totalErrors: 0, success: false };
  }
}

function testBuilds() {
  console.log('🏗️ Testujem buildy...');
  
  try {
    console.log('   Frontend build...');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('   ✅ Frontend build úspešný');
    
    console.log('   Backend build...');
    execSync('cd backend && npm run build', { stdio: 'pipe' });
    console.log('   ✅ Backend build úspešný');
    
    return true;
  } catch (error) {
    console.log('   ❌ Build zlyhal:', error.message.split('\n')[0]);
    return false;
  }
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backup-before-eslint-fix-${timestamp}`;
  
  console.log(`💾 Vytváram backup do ${backupDir}...`);
  
  try {
    execSync(`git stash push -m "ESLint fix backup ${timestamp}"`, { stdio: 'pipe' });
    console.log('✅ Git stash backup vytvorený');
    return true;
  } catch (error) {
    console.log('⚠️ Git stash zlyhal, pokračujem bez backupu');
    return false;
  }
}

// Hlavná master fix funkcia
async function masterFix() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 MASTER FIX WORKFLOW SPUSTENÝ');
    console.log('================================\n');
    
    // 0. Vytvor backup
    createBackup();
    
    // 1. Počiatočná analýza
    console.log('📊 FÁZA 1: Počiatočná analýza');
    console.log('------------------------------');
    const initialStats = getESLintStats();
    console.log(`   Súbory s chybami: ${initialStats.totalFiles}`);
    console.log(`   Celkový počet chýb: ${initialStats.totalErrors}`);
    
    if (initialStats.totalErrors === 0) {
      console.log('🎉 Žiadne ESLint chyby! Codebase je už čistý.');
      return;
    }
    
    // 2. Test počiatočných buildov
    console.log('\n🏗️ FÁZA 2: Test počiatočných buildov');
    console.log('-------------------------------------');
    const initialBuildsOk = testBuilds();
    
    // 3. Bulk automatické opravy
    console.log('\n🔧 FÁZA 3: Bulk automatické opravy');
    console.log('-----------------------------------');
    
    if (fs.existsSync('scripts/eslint-bulk-fix.js')) {
      try {
        execSync('node scripts/eslint-bulk-fix.js', { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️ Bulk fix dokončený s chybami, pokračujem...');
      }
    } else {
      console.log('⚠️ eslint-bulk-fix.js nenájdený, preskakujem...');
    }
    
    const afterBulkStats = getESLintStats();
    const bulkFixed = initialStats.totalErrors - afterBulkStats.totalErrors;
    console.log(`   Bulk fix opravil: ${bulkFixed} chýb`);
    
    // 4. Smart inteligentné opravy
    console.log('\n🧠 FÁZA 4: Smart inteligentné opravy');
    console.log('------------------------------------');
    
    if (fs.existsSync('scripts/eslint-smart-fix.js')) {
      try {
        execSync('node scripts/eslint-smart-fix.js', { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️ Smart fix dokončený s chybami, pokračujem...');
      }
    } else {
      console.log('⚠️ eslint-smart-fix.js nenájdený, preskakujem...');
    }
    
    const afterSmartStats = getESLintStats();
    const smartFixed = afterBulkStats.totalErrors - afterSmartStats.totalErrors;
    console.log(`   Smart fix opravil: ${smartFixed} chýb`);
    
    // 5. Špecializované opravy
    console.log('\n🎯 FÁZA 5: Špecializované opravy');
    console.log('--------------------------------');
    
    if (fs.existsSync('scripts/eslint-specialized-fix.js')) {
      try {
        execSync('node scripts/eslint-specialized-fix.js', { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️ Specialized fix dokončený s chybami, pokračujem...');
      }
    } else {
      console.log('⚠️ eslint-specialized-fix.js nenájdený, preskakujem...');
    }
    
    const afterSpecializedStats = getESLintStats();
    const specializedFixed = afterSmartStats.totalErrors - afterSpecializedStats.totalErrors;
    console.log(`   Specialized fix opravil: ${specializedFixed} chýb`);
    
    // 6. Finálne ESLint --fix
    console.log('\n🔨 FÁZA 6: Finálne ESLint --fix');
    console.log('-------------------------------');
    
    try {
      execSync('npx eslint . --ext .ts,.tsx --fix', { stdio: 'pipe' });
      console.log('✅ Finálne ESLint --fix dokončené');
    } catch (error) {
      console.log('⚠️ Finálne ESLint --fix dokončené s chybami');
    }
    
    const finalStats = getESLintStats();
    const finalFixed = afterSpecializedStats.totalErrors - finalStats.totalErrors;
    console.log(`   Finálne fix opravil: ${finalFixed} chýb`);
    
    // 7. Finálna validácia
    console.log('\n✅ FÁZA 7: Finálna validácia');
    console.log('-----------------------------');
    
    const finalBuildsOk = testBuilds();
    
    // 8. Súhrn výsledkov
    console.log('\n🎉 MASTER FIX DOKONČENÝ');
    console.log('=======================');
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const totalFixed = initialStats.totalErrors - finalStats.totalErrors;
    const successRate = ((totalFixed / initialStats.totalErrors) * 100).toFixed(1);
    
    console.log(`⏱️  Celkový čas: ${totalTime} minút`);
    console.log(`📊 Výsledky:`);
    console.log(`   Pred: ${initialStats.totalErrors} chýb v ${initialStats.totalFiles} súboroch`);
    console.log(`   Po: ${finalStats.totalErrors} chýb v ${finalStats.totalFiles} súboroch`);
    console.log(`   Opravené: ${totalFixed} chýb (${successRate}%)`);
    
    console.log(`\n📈 Rozdelenie opráv:`);
    console.log(`   Bulk fix: ${bulkFixed} chýb`);
    console.log(`   Smart fix: ${smartFixed} chýb`);
    console.log(`   Specialized fix: ${specializedFixed} chýb`);
    console.log(`   Final fix: ${finalFixed} chýb`);
    
    console.log(`\n🏗️ Build status:`);
    console.log(`   Počiatočné buildy: ${initialBuildsOk ? '✅' : '❌'}`);
    console.log(`   Finálne buildy: ${finalBuildsOk ? '✅' : '❌'}`);
    
    // 9. Odporúčania pre zostávajúce chyby
    if (finalStats.totalErrors > 0) {
      console.log(`\n📋 ZOSTÁVAJÚCE CHYBY (${finalStats.totalErrors}):`);
      console.log('Tieto chyby vyžadujú manuálne opravenie:');
      
      try {
        const detailedErrors = execSync('npx eslint . --ext .ts,.tsx --format json', { encoding: 'utf8' });
        const errorData = JSON.parse(detailedErrors);
        
        const topFiles = errorData
          .filter(f => f.messages.length > 0)
          .sort((a, b) => b.messages.length - a.messages.length)
          .slice(0, 10);
        
        topFiles.forEach(file => {
          const fileName = path.basename(file.filePath);
          const errorCount = file.messages.length;
          const topRules = file.messages
            .reduce((acc, msg) => {
              const rule = msg.ruleId || 'unknown';
              acc[rule] = (acc[rule] || 0) + 1;
              return acc;
            }, {});
          
          const topRulesList = Object.entries(topRules)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([rule, count]) => `${rule}:${count}`)
            .join(', ');
          
          console.log(`   ${errorCount}\t${fileName}\t(${topRulesList})`);
        });
        
      } catch (error) {
        console.log('   Detailná analýza nedostupná');
      }
      
      console.log(`\n💡 ĎALŠIE KROKY:`);
      console.log(`   1. Manuálne oprav zostávajúce ${finalStats.totalErrors} chýb`);
      console.log(`   2. Zameraj sa na súbory s najviac chybami`);
      console.log(`   3. Použij 'npx eslint [file] --fix' pre jednotlivé súbory`);
      console.log(`   4. Pre komplexné any types vytvor proper interfaces`);
    } else {
      console.log(`\n🏆 PERFEKTNÝ VÝSLEDOK!`);
      console.log(`✅ 0 errors, 0 warnings - codebase je 100% čistý!`);
    }
    
    // 10. Uloženie reportu
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalTime,
      initial: initialStats,
      final: finalStats,
      fixed: totalFixed,
      successRate: successRate,
      phases: {
        bulk: bulkFixed,
        smart: smartFixed,
        specialized: specializedFixed,
        final: finalFixed
      },
      builds: {
        initial: initialBuildsOk,
        final: finalBuildsOk
      }
    };
    
    fs.writeFileSync('eslint-master-fix-report.json', JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailný report uložený do eslint-master-fix-report.json`);
    
  } catch (error) {
    console.error('\n❌ KRITICKÁ CHYBA v master fix:', error.message);
    console.log('\n🔄 RECOVERY MOŽNOSTI:');
    console.log('   1. git stash pop (ak bol vytvorený backup)');
    console.log('   2. git checkout -- . (reset všetkých zmien)');
    console.log('   3. Spusti jednotlivé skripty manuálne');
    process.exit(1);
  }
}

// Spusti ak je volaný priamo
if (require.main === module) {
  masterFix();
}

module.exports = { masterFix };
