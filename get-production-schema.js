#!/usr/bin/env node
/**
 * Get Production Database Schema via API
 */

async function getProductionSchema() {
  const API_URL = 'https://blackrent-app-production-4d6f.up.railway.app/api';
  
  console.log('🔍 Fetching production database schema...\n');
  
  try {
    // Try to get schema info via health endpoint or create a temporary endpoint
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    console.log('Production API Status:', data);
    console.log('\n⚠️  Cannot directly access production database schema via API.');
    console.log('Please provide production DATABASE_URL manually.');
    console.log('\nYou can get it from:');
    console.log('1. Railway Dashboard → blackrent-app → Variables → DATABASE_URL');
    console.log('2. Or run: railway variables --environment production');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getProductionSchema();




