// Script na reset Railway databázy
// Spustí sa z browsera alebo node.js

async function resetDatabase() {
  try {
    console.log('🗑️ Resetujem databázu...');
    
    // Admin token - nahraďte svojim aktuálnym tokenom
    const token = prompt('Zadajte admin token:');
    if (!token) {
      console.log('❌ Token je potrebný');
      return;
    }
    
    const response = await fetch('https://blackrent-app-production-4d6f.up.railway.app/api/admin/reset-database', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Databáza resetovaná!');
      console.log(`📊 Zmazané tabuľky: ${result.tablesDropped}`);
      console.log('🔄 Teraz reštartujte Railway aplikáciu pre vytvorenie novej schémy');
    } else {
      console.log('❌ Chyba:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Pre browser
if (typeof window !== 'undefined') {
  window.resetDatabase = resetDatabase;
  console.log('💡 Spustite: resetDatabase()');
}

// Pre node.js
if (typeof module !== 'undefined') {
  module.exports = { resetDatabase };
} 