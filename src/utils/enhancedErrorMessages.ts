/**
 * 📝 ENHANCED ERROR MESSAGES
 * 
 * User-friendly error messages s kontextom a akčnými návrhmi
 */

export interface ErrorContext {
  action?: string; // 'login', 'save', 'load', 'delete', etc.
  entity?: string; // 'vehicle', 'rental', 'customer', etc.
  location?: string; // component/page context
}

export interface EnhancedErrorMessage {
  title: string;
  message: string;
  suggestion: string;
  actionLabel?: string;
  severity: 'error' | 'warning' | 'info';
  emoji: string;
  category: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
}

/**
 * 🎯 Generuje user-friendly error message na základe kontextu
 */
export const getEnhancedErrorMessage = (
  error: any, 
  context: ErrorContext = {}
): EnhancedErrorMessage => {
  const { action, entity } = context;
  
  // Network/Connection errors
  if (isNetworkError(error)) {
    return {
      title: '🌐 Problém s pripojením',
      message: navigator.onLine 
        ? 'Server je momentálne nedostupný alebo preťažený.'
        : 'Skontrolujte svoje internetové pripojenie.',
      suggestion: navigator.onLine 
        ? 'Počkajte chvíľu a skúste znova. Ak problém pretrváva, kontaktujte podporu.'
        : 'Zapnite Wi-Fi alebo mobilné dáta a skúste znova.',
      actionLabel: 'Skúsiť znova',
      severity: 'warning',
      emoji: '🌐',
      category: 'network'
    };
  }

  // Authentication errors
  if (isAuthError(error)) {
    return {
      title: '🔐 Problém s prihlásením',
      message: getAuthErrorMessage(error),
      suggestion: 'Skontrolujte svoje prihlasovacie údaje a skúste znova.',
      actionLabel: 'Prihlásiť sa',
      severity: 'error',
      emoji: '🔐',
      category: 'auth'
    };
  }

  // Validation errors
  if (isValidationError(error)) {
    return {
      title: '📝 Neplatné údaje',
      message: getValidationErrorMessage(error, entity),
      suggestion: 'Skontrolujte všetky povinné polia a ich formát.',
      actionLabel: 'Opraviť',
      severity: 'warning',
      emoji: '📝',
      category: 'validation'
    };
  }

  // Server errors (5xx)
  if (isServerError(error)) {
    return {
      title: '⚙️ Problém so serverom',
      message: getServerErrorMessage(error, action, entity),
      suggestion: 'Toto je dočasný problém. Skúste znova o chvíľu.',
      actionLabel: 'Skúsiť znova',
      severity: 'error',
      emoji: '⚙️',
      category: 'server'
    };
  }

  // Permission errors
  if (isPermissionError(error)) {
    return {
      title: '⛔ Nedostatočné oprávnenia',
      message: getPermissionErrorMessage(action, entity),
      suggestion: 'Kontaktujte administrátora pre získanie potrebných oprávnení.',
      actionLabel: 'Kontaktovať admin',
      severity: 'warning',
      emoji: '⛔',
      category: 'auth'
    };
  }

  // Rate limiting
  if (isRateLimitError(error)) {
    return {
      title: '⏸️ Príliš veľa pokusov',
      message: 'Prekročili ste limit requestov za minútu.',
      suggestion: 'Počkajte chvíľu predtým ako skúsite znova.',
      actionLabel: 'Počkať',
      severity: 'warning',
      emoji: '⏸️',
      category: 'server'
    };
  }

  // Not found errors
  if (isNotFoundError(error)) {
    return {
      title: '🔍 Nenašli sa dáta',
      message: getNotFoundMessage(entity),
      suggestion: 'Dáta mohli byť zmazané alebo premiestnené.',
      actionLabel: 'Obnoviť',
      severity: 'info',
      emoji: '🔍',
      category: 'server'
    };
  }

  // Generic fallback
  return {
    title: '❌ Neočakávaná chyba',
    message: 'Nastala neočakávaná chyba pri vykonávaní akcie.',
    suggestion: 'Obnovte stránku alebo skúste znova o chvíľu.',
    actionLabel: 'Obnoviť stránku',
    severity: 'error',
    emoji: '❌',
    category: 'unknown'
  };
};

// Helper functions pre detekciu typov chýb
const isNetworkError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('failed to fetch') || 
         message.includes('network error') ||
         message.includes('connection refused') ||
         !navigator.onLine;
};

const isAuthError = (error: any): boolean => {
  return error?.status === 401 || error?.status === 403;
};

const isValidationError = (error: any): boolean => {
  return error?.status === 400 || error?.status === 422;
};

const isServerError = (error: any): boolean => {
  return error?.status >= 500 && error?.status < 600;
};

const isPermissionError = (error: any): boolean => {
  return error?.status === 403;
};

const isRateLimitError = (error: any): boolean => {
  return error?.status === 429;
};

const isNotFoundError = (error: any): boolean => {
  return error?.status === 404;
};

// Specific error message generators
const getAuthErrorMessage = (error: any): string => {
  switch (error?.status) {
    case 401:
      return 'Vaša relácia vypršala. Prihláste sa znova.';
    case 403:
      return 'Nemáte oprávnenie na túto akciu.';
    default:
      return 'Problém s autentifikáciou.';
  }
};

const getValidationErrorMessage = (error: any, entity?: string): string => {
  const entityName = getEntityName(entity);
  
  if (error?.details) {
    return `Neplatné údaje pre ${entityName}: ${error.details}`;
  }
  
  return `Skontrolujte údaje pre ${entityName}. Niektoré polia sú neplatné.`;
};

const getServerErrorMessage = (error: any, action?: string, entity?: string): string => {
  const actionText = getActionText(action);
  const entityName = getEntityName(entity);
  
  if (error?.status >= 500) {
    return `Nepodarilo sa ${actionText} ${entityName} kvôli problému so serverom.`;
  }
  
  return `Problém so serverom pri ${actionText} ${entityName}.`;
};

const getPermissionErrorMessage = (action?: string, entity?: string): string => {
  const actionText = getActionText(action);
  const entityName = getEntityName(entity);
  
  return `Nemáte oprávnenie ${actionText} ${entityName}.`;
};

const getNotFoundMessage = (entity?: string): string => {
  const entityName = getEntityName(entity);
  return `Požadované ${entityName} sa nenašli alebo boli zmazané.`;
};

// Helper functions pre user-friendly názvy
const getEntityName = (entity?: string): string => {
  const entityNames: Record<string, string> = {
    vehicle: 'vozidlo',
    rental: 'prenájom', 
    customer: 'zákazníka',
    expense: 'náklad',
    insurance: 'poistenie',
    settlement: 'vyúčtovanie',
    user: 'používateľa',
    company: 'firmu',
  };
  
  return entityNames[entity || ''] || 'dáta';
};

const getActionText = (action?: string): string => {
  const actionTexts: Record<string, string> = {
    create: 'vytvoriť',
    save: 'uložiť',
    update: 'aktualizovať',
    delete: 'zmazať',
    load: 'načítať',
    login: 'prihlásiť',
    logout: 'odhlásiť',
    export: 'exportovať',
    import: 'importovať',
  };
  
  return actionTexts[action || ''] || 'spracovať';
};

/**
 * 🎨 Error recovery suggestions na základe kontextu
 */
export const getRecoverySuggestions = (
  error: any, 
  context: ErrorContext = {}
): string[] => {
  const suggestions: string[] = [];
  
  if (isNetworkError(error)) {
    suggestions.push('Skontrolujte internetové pripojenie');
    suggestions.push('Skúste obnoviť stránku');
    suggestions.push('Počkajte chvíľu a skúste znova');
  }
  
  if (isAuthError(error)) {
    suggestions.push('Prihláste sa znova');
    suggestions.push('Skontrolujte prihlasovacie údaje');
    suggestions.push('Kontaktujte administrátora');
  }
  
  if (isValidationError(error)) {
    suggestions.push('Skontrolujte povinné polia');
    suggestions.push('Overte formát zadaných údajov');
    suggestions.push('Skúste s inými údajmi');
  }
  
  if (isServerError(error)) {
    suggestions.push('Počkajte chvíľu a skúste znova');
    suggestions.push('Kontaktujte technickú podporu');
    suggestions.push('Skúste inú akciu');
  }
  
  return suggestions;
};