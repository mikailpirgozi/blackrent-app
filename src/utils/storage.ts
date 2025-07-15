// Utility funkcie pre prácu s cookies a persistent storage

export class StorageManager {
  private static COOKIE_PREFIX = 'blackrent_';
  private static COOKIE_EXPIRY_DAYS = 30;

  /**
   * Nastaví cookie s expiration time
   */
  static setCookie(name: string, value: string, days: number = this.COOKIE_EXPIRY_DAYS): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const expiresString = expires.toUTCString();
    
    document.cookie = `${this.COOKIE_PREFIX}${name}=${encodeURIComponent(value)};expires=${expiresString};path=/;secure;samesite=strict`;
  }

  /**
   * Získa cookie hodnotu
   */
  static getCookie(name: string): string | null {
    const cookieName = `${this.COOKIE_PREFIX}${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(cookieName) === 0) {
        return decodeURIComponent(cookie.substring(cookieName.length));
      }
    }
    return null;
  }

  /**
   * Zmaže cookie
   */
  static removeCookie(name: string): void {
    document.cookie = `${this.COOKIE_PREFIX}${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Uloží token a user data s fallback na localStorage
   */
  static setAuthData(token: string, user: any, rememberMe: boolean = true): void {
    try {
      // Uložiť do cookies (preferované)
      if (rememberMe) {
        this.setCookie('token', token, this.COOKIE_EXPIRY_DAYS);
        this.setCookie('user', JSON.stringify(user), this.COOKIE_EXPIRY_DAYS);
        this.setCookie('remember_me', 'true', this.COOKIE_EXPIRY_DAYS);
      } else {
        // Pre session mode stále použiť cookies ale s kratším expiration
        this.setCookie('token', token, 1); // 1 deň
        this.setCookie('user', JSON.stringify(user), 1);
        this.setCookie('remember_me', 'false', 1);
      }

      // Fallback do localStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('blackrent_token', token);
      storage.setItem('blackrent_user', JSON.stringify(user));
      localStorage.setItem('blackrent_remember_me', rememberMe.toString());
      
      console.log('💾 Auth data uložené do:', rememberMe ? 'cookies (30 dní) + localStorage' : 'cookies (1 deň) + sessionStorage');
    } catch (error) {
      console.error('Chyba pri ukladaní auth data:', error);
      // Fallback na localStorage aj pri chybe
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('blackrent_token', token);
      storage.setItem('blackrent_user', JSON.stringify(user));
      localStorage.setItem('blackrent_remember_me', rememberMe.toString());
    }
  }

  /**
   * Načíta token a user data s fallback na localStorage
   */
  static getAuthData(): { token: string | null; user: any | null } {
    try {
      // Skús najskôr cookies
      let token = this.getCookie('token');
      let userStr = this.getCookie('user');
      
      if (token && userStr) {
        console.log('🍪 Auth data načítané z cookies');
        return {
          token,
          user: JSON.parse(userStr)
        };
      }

      // Fallback na localStorage/sessionStorage
      console.log('📦 Fallback na localStorage/sessionStorage');
      token = localStorage.getItem('blackrent_token');
      userStr = localStorage.getItem('blackrent_user');
      
      if (!token || !userStr) {
        token = sessionStorage.getItem('blackrent_token');
        userStr = sessionStorage.getItem('blackrent_user');
      }
      
      let user = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (error) {
          console.error('Chyba pri parsovaní user data:', error);
        }
      }
      
      return { token, user };
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
      // Vymaž cookies
      this.removeCookie('token');
      this.removeCookie('user');
      this.removeCookie('remember_me');
      
      // Vymaž localStorage/sessionStorage
      localStorage.removeItem('blackrent_token');
      localStorage.removeItem('blackrent_user');
      localStorage.removeItem('blackrent_remember_me');
      sessionStorage.removeItem('blackrent_token');
      sessionStorage.removeItem('blackrent_user');
      
      console.log('🧹 Všetky auth data vymazané');
    } catch (error) {
      console.error('Chyba pri mazaní auth data:', error);
    }
  }

  /**
   * Kontroluje či je remember me enabled
   */
  static isRememberMeEnabled(): boolean {
    const cookieValue = this.getCookie('remember_me');
    if (cookieValue !== null) {
      return cookieValue === 'true';
    }
    
    // Fallback na localStorage
    const localValue = localStorage.getItem('blackrent_remember_me');
    return localValue === 'true';
  }
} 