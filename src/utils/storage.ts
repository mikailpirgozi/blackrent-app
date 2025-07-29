// Utility funkcie pre prácu s cookies a persistent storage

export class StorageManager {
  private static COOKIE_PREFIX = 'blackrent_';
  private static COOKIE_EXPIRY_DAYS = 90; // 3 mesiace

  /**
   * Nastaví cookie s expiration time
   */
  static setCookie(name: string, value: string, days: number = this.COOKIE_EXPIRY_DAYS): void {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const expiresString = expires.toUTCString();
      
      // Railway podporuje secure cookies len na HTTPS
      const isSecure = window.location.protocol === 'https:';
      const cookieString = `${this.COOKIE_PREFIX}${name}=${encodeURIComponent(value)};expires=${expiresString};path=/;${isSecure ? 'secure;' : ''}samesite=lax`;
      
      document.cookie = cookieString;
      console.log(`🍪 Cookie nastavené: ${name}, secure: ${isSecure}`);
    } catch (error) {
      console.error('Chyba pri nastavovaní cookie:', error);
    }
  }

  /**
   * Získa cookie hodnotu
   */
  static getCookie(name: string): string | null {
    try {
      const cookieName = `${this.COOKIE_PREFIX}${name}=`;
      const cookies = document.cookie.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
          return decodeURIComponent(cookie.substring(cookieName.length));
        }
      }
      return null;
    } catch (error) {
      console.error('Chyba pri čítaní cookie:', error);
      return null;
    }
  }

  /**
   * Zmaže cookie
   */
  static removeCookie(name: string): void {
    try {
      document.cookie = `${this.COOKIE_PREFIX}${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      console.log(`🗑️ Cookie zmazané: ${name}`);
    } catch (error) {
      console.error('Chyba pri mazaní cookie:', error);
    }
  }

  /**
   * Uloží token a user data s fallback na localStorage
   */
  static setAuthData(token: string, user: any, rememberMe: boolean = true): void {
    try {
      console.log('💾 Ukladám auth data...', { rememberMe, token: !!token, user: !!user });
      
      // VŽDY uložiť do localStorage ako primárny storage
      localStorage.setItem('blackrent_token', token);
      localStorage.setItem('blackrent_user', JSON.stringify(user));
      localStorage.setItem('blackrent_remember_me', rememberMe.toString());
      
      // Pokus o uloženie do cookies ako bonus
      if (rememberMe) {
        try {
          this.setCookie('token', token, this.COOKIE_EXPIRY_DAYS);
          this.setCookie('user', JSON.stringify(user), this.COOKIE_EXPIRY_DAYS);
          this.setCookie('remember_me', 'true', this.COOKIE_EXPIRY_DAYS);
        } catch (cookieError) {
          console.warn('Cookies sa nepodarilo uložiť, ale localStorage funguje:', cookieError);
        }
      } else {
        // Pre session mode použiť sessionStorage ako fallback
        sessionStorage.setItem('blackrent_token', token);
        sessionStorage.setItem('blackrent_user', JSON.stringify(user));
        
        try {
          this.setCookie('token', token, 1); // 1 deň
          this.setCookie('user', JSON.stringify(user), 1);
          this.setCookie('remember_me', 'false', 1);
        } catch (cookieError) {
          console.warn('Session cookies sa nepodarilo uložiť:', cookieError);
        }
      }
      
      console.log('✅ Auth data uložené úspešne');
    } catch (error) {
      console.error('Chyba pri ukladaní auth data:', error);
      // Posledný fallback - aspoň localStorage
      try {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('blackrent_token', token);
        storage.setItem('blackrent_user', JSON.stringify(user));
        localStorage.setItem('blackrent_remember_me', rememberMe.toString());
      } catch (fallbackError) {
        console.error('Aj fallback ukladanie zlyhalo:', fallbackError);
      }
    }
  }

  /**
   * Načíta token a user data s fallback na localStorage
   */
  static getAuthData(): { token: string | null; user: any | null } {
    try {
      // Primárne: localStorage (najspoľahlivejšie)
      let token = localStorage.getItem('blackrent_token');
      let userStr = localStorage.getItem('blackrent_user');
      
      if (token && userStr) {
        console.log('📦 Auth data načítané z localStorage');
        return {
          token,
          user: JSON.parse(userStr)
        };
      }

      // Fallback 1: cookies
      token = this.getCookie('token');
      userStr = this.getCookie('user');
      
      if (token && userStr) {
        console.log('🍪 Auth data načítané z cookies');
        try {
          return {
            token,
            user: JSON.parse(userStr)
          };
        } catch (parseError) {
          console.error('Chyba pri parsovaní user data z cookies:', parseError);
        }
      }

      // Fallback 2: sessionStorage
      token = sessionStorage.getItem('blackrent_token');
      userStr = sessionStorage.getItem('blackrent_user');
      
      if (token && userStr) {
        console.log('🗂️ Auth data načítané z sessionStorage');
        try {
          return {
            token,
            user: JSON.parse(userStr)
          };
        } catch (parseError) {
          console.error('Chyba pri parsovaní user data z sessionStorage:', parseError);
        }
      }
      
      console.log('❌ Žiadne auth data nenájdené');
      return { token: null, user: null };
    } catch (error) {
      console.error('Chyba pri načítaní auth data:', error);
      return { token: null, user: null };
    }
  }

  /**
   * Vymaže všetky auth data
   */
  static clearAuthData(): void {
    try {
      console.log('🧹 Mažem všetky auth data...');
      
      // Vymaž cookies
      this.removeCookie('token');
      this.removeCookie('user');
      this.removeCookie('remember_me');
      
      // Vymaž localStorage
      localStorage.removeItem('blackrent_token');
      localStorage.removeItem('blackrent_user');
      localStorage.removeItem('blackrent_remember_me');
      
      // Vymaž sessionStorage
      sessionStorage.removeItem('blackrent_token');
      sessionStorage.removeItem('blackrent_user');
      
      console.log('✅ Všetky auth data vymazané');
    } catch (error) {
      console.error('Chyba pri mazaní auth data:', error);
    }
  }

  /**
   * Kontroluje či je remember me enabled
   */
  static isRememberMeEnabled(): boolean {
    try {
      // Skús cookies
      const cookieValue = this.getCookie('remember_me');
      if (cookieValue !== null) {
        return cookieValue === 'true';
      }
      
      // Fallback na localStorage
      const localValue = localStorage.getItem('blackrent_remember_me');
      return localValue === 'true';
    } catch (error) {
      console.error('Chyba pri kontrole remember me:', error);
      return true; // Default na true pre perzistentné prihlásenie
    }
  }

  // 🔧 Tracking či už boli storage testy vykonané
  private static storageTestDone = false;

  /**
   * Testuje či storage funguje správne
   */
  static testStorage(): void {
    // ⚡ OPTIMALIZÁCIA: Spustiť len raz, alebo vždy v development
    if (this.storageTestDone && process.env.NODE_ENV === 'production') {
      return; // Už bolo testované
    }
    
    try {
      console.log('🔍 Testing storage capabilities...');
      
      // Test localStorage
      const testKey = 'blackrent_test';
      const testValue = 'test_value';
      
      localStorage.setItem(testKey, testValue);
      const localResult = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      console.log('📦 localStorage test:', localResult === testValue ? '✅ OK' : '❌ FAIL');
      
      // Test cookies
      this.setCookie('test', testValue, 1);
      const cookieResult = this.getCookie('test');
      this.removeCookie('test');
      
      console.log('🍪 Cookies test:', cookieResult === testValue ? '✅ OK' : '❌ FAIL');
      
      // Test sessionStorage
      sessionStorage.setItem(testKey, testValue);
      const sessionResult = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      
      console.log('🗂️ sessionStorage test:', sessionResult === testValue ? '✅ OK' : '❌ FAIL');
      
      // Označiť ako dokončené
      this.storageTestDone = true;
      
    } catch (error) {
      console.error('🔍 Storage test error:', error);
    }
  }
} 