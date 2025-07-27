// 🔧 OPRAVA DATABÁZOVEJ SCHÉMY
// Spustite v browser console na blackrent-app.vercel.app

async function fixSchema() {
  try {
    console.log('🔧 Opravujem databázovú schému...');
    
    // Najprv sa prihláste ako admin a získajte token z localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ Nie ste prihlásený! Prihláste sa ako admin najprv.');
      return;
    }
    
    const response = await fetch('https://blackrent-app-production-4d6f.up.railway.app/api/admin/fix-schema', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Databázová schéma opravená!');
      console.log(`📊 Companies stĺpce: ${result.details.companiesColumns}`);
      console.log(`📊 Vehicles stĺpce: ${result.details.vehiclesColumns}`);
      console.log('🎯 Teraz môžete vytvárať firmy bez chyby!');
      
      // Zobraz štruktúru tabuliek
      console.log('📋 Companies štruktúra:', result.details.companiesStructure);
      console.log('📋 Vehicles štruktúra:', result.details.vehiclesStructure);
      
    } else {
      console.log('❌ Chyba pri oprave schémy:', result.error);
      console.log('📝 Details:', result.details);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Sprístupni funkciu v browseri
if (typeof window !== 'undefined') {
  window.fixSchema = fixSchema;
  console.log('💡 1. Prihláste sa ako admin na blackrent-app.vercel.app');
  console.log('💡 2. Spustite: fixSchema()');
}

// Export pre node.js
if (typeof module !== 'undefined') {
  module.exports = { fixSchema };
} 