/**
 * AUTH DIAGNOSTICS
 * Helper script to debug auth issues in browser console
 */

export function diagnoseAuthIssue() {
  console.log('🔍 AUTH DIAGNOSTICS\n');
  console.log('==================\n');

  // 1. Check localStorage
  console.log('📦 LocalStorage:');
  const token = localStorage.getItem('blackrent_token');
  const userStr = localStorage.getItem('blackrent_user');
  
  console.log('  Token:', token ? '✅ EXISTS' : '❌ MISSING');
  console.log('  User:', userStr ? '✅ EXISTS' : '❌ MISSING');
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('  User data:', {
        username: user.username,
        role: user.role,
        email: user.email,
        isActive: user.isActive
      });
    } catch (e) {
      console.log('  ❌ User data parse error:', e);
    }
  }
  console.log('\n');

  // 2. Check AuthContext
  console.log('🔐 AuthContext State:');
  console.log('  (Check React DevTools for AuthProvider state)');
  console.log('\n');

  // 3. Check PermissionsContext
  console.log('🛡️ PermissionsContext:');
  console.log('  (Check React DevTools for PermissionsProvider state)');
  console.log('\n');

  // 4. Test API connection
  console.log('🌐 Testing API Connection:');
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  console.log('  API URL:', apiUrl);
  
  fetch(`${apiUrl}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(data => {
      console.log('  ✅ API Response:', data);
      if (data.success && data.data) {
        console.log('  User from API:', {
          username: data.data.username,
          role: data.data.role,
          isActive: data.data.isActive
        });
      }
    })
    .catch(err => {
      console.log('  ❌ API Error:', err);
    });

  console.log('\n');
  console.log('==================');
  console.log('💡 TIP: If layout is not showing:');
  console.log('  1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
  console.log('  2. Clear cache: localStorage.clear()');
  console.log('  3. Logout and login again');
  console.log('  4. Check browser console for errors');
  console.log('==================\n');
}

// Make it globally available
if (typeof window !== 'undefined') {
  (window as any).diagnoseAuth = diagnoseAuthIssue;
  console.log('💡 Auth diagnostics ready! Run: window.diagnoseAuth()');
}

