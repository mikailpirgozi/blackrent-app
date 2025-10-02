// 🗑️ JEDNODUCHÝ RESET DATABÁZY
// Spustite v browser console na blackrent-app.vercel.app

async function easyReset() {
  try {
    console.log('🔑 Získavam admin token...');
    
    // 1. Získaj token
    const tokenResponse = await fetch('https://blackrent-app-production-4d6f.up.railway.app/api/admin/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Black123'
      })
    });
    
    const tokenResult = await tokenResponse.json();
    
    if (!tokenResult.success) {
      console.log('❌ Chyba pri získavaní tokenu:', tokenResult.error);
      return;
    }
    
    console.log('✅ Token získaný!');
    const token = tokenResult.token;
    
    // 2. Reset databázy
    console.log('🗑️ Resetujem databázu...');
    
    const resetResponse = await fetch('https://blackrent-app-production-4d6f.up.railway.app/api/admin/reset-database', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const resetResult = await resetResponse.json();
    
    if (resetResult.success) {
      console.log('✅ Databáza resetovaná!');
      console.log(`📊 Zmazané tabuľky: ${resetResult.tablesDropped}`);
      console.log('🔄 Railway aplikácia sa reštartuje... (1-2 minúty)');
      console.log('🎯 Po reštarte môžete importovať CSV dáta!');
    } else {
      console.log('❌ Chyba pri resete:', resetResult.error);
    }
    
    return resetResult;
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Sprístupni funkciu v browseri
if (typeof window !== 'undefined') {
  window.easyReset = easyReset;
  console.log('💡 Spustite: easyReset()');
  console.log('🎯 Alebo skopírujte celú funkciu do console');
}

// Export pre node.js
if (typeof module !== 'undefined') {
  module.exports = { easyReset };
} 