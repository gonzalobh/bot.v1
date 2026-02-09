// ═══════════════════════════════════════════════════════════════════
// Translation Loader - Carga optimizada de traducciones por idioma
// ═══════════════════════════════════════════════════════════════════

class TranslationLoader {
  constructor() {
    this.cache = {};
    this.currentLanguage = null;
    this.translations = {};
    this.registeredElements = new Map(); // Map de elementos registrados
  }
  
  /**
   * Carga un idioma específico
   */
  async loadLanguage(lang) {
    // Si ya está en caché, retornar
    if (this.cache[lang]) {
      console.log(`📦 Traducciones de ${lang} desde caché`);
      this.translations = this.cache[lang];
      this.currentLanguage = lang;
      return this.translations;
    }
    
    console.log(`🔄 Cargando traducciones: ${lang}...`);
    
    try {
      // Intentar cargar desde archivo separado por idioma
      let response = await fetch(`/translations/${lang}.json`);
      
      // Si no existe el archivo separado, usar el archivo completo
      if (!response.ok) {
        console.log(`⚠️ No se encontró /translations/${lang}.json, usando archivo completo`);
        response = await fetch('/translations_data.json');
        const allData = await response.json();
        
        // Extraer solo el idioma necesario
        const langData = {};
        Object.keys(allData).forEach(key => {
          if (allData[key] && typeof allData[key] === 'object' && allData[key][lang]) {
            langData[key] = allData[key][lang];
          } else if (typeof allData[key] === 'string') {
            langData[key] = allData[key];
          }
        });
        
        this.translations = langData;
        this.cache[lang] = langData;
      } else {
        this.translations = await response.json();
        this.cache[lang] = this.translations;
      }
      
      this.currentLanguage = lang;
      console.log(`✅ Traducciones cargadas: ${lang} (${Object.keys(this.translations).length} claves)`);
      return this.translations;
      
    } catch (error) {
      console.error(`❌ Error al cargar traducciones de ${lang}:`, error);
      
      // Fallback a español
      if (lang !== 'es') {
        console.log('🔄 Intentando cargar español como fallback...');
        return this.loadLanguage('es');
      }
      
      throw error;
    }
  }
  
  /**
   * Traduce una clave
   */
  translate(key, vars = {}) {
    let text = this.translations[key] || key;
    
    // Reemplazar variables {var}
    Object.keys(vars).forEach(varKey => {
      text = text.replace(new RegExp(`{${varKey}}`, 'g'), vars[varKey]);
    });
    
    return text;
  }
  
  /**
   * Alias corto para translate
   */
  t(key, vars) {
    return this.translate(key, vars);
  }
  
  /**
   * Registra un elemento para auto-traducción
   */
  register(element, key, target = 'text', options = {}) {
    if (!element) return;
    
    this.registeredElements.set(element, { key, target, options });
    this.updateElement(element, key, target, options);
  }
  
  /**
   * Actualiza un elemento registrado
   */
  updateElement(element, key, target = 'text', options = {}) {
    const text = this.translate(key, options);
    
    switch(target) {
      case 'text':
        element.textContent = text;
        break;
      case 'placeholder':
        element.placeholder = text;
        break;
      case 'title':
        element.title = text;
        break;
      case 'value':
        element.value = text;
        break;
      case 'html':
        element.innerHTML = text;
        break;
    }
  }
  
  /**
   * Aplica traducciones a todos los elementos registrados
   */
  applyTranslations() {
    this.registeredElements.forEach((config, element) => {
      this.updateElement(element, config.key, config.target, config.options);
    });
    
    // También traducir elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const target = el.dataset.i18nTarget || 'text';
      this.updateElement(el, key, target);
    });
    
    console.log(`✅ Traducciones aplicadas (${this.registeredElements.size} elementos)`);
  }
  
  /**
   * Cambia el idioma actual
   */
  async changeLanguage(newLang) {
    if (newLang === this.currentLanguage) {
      console.log(`ℹ️ Ya estás en ${newLang}`);
      return;
    }
    
    await this.loadLanguage(newLang);
    this.applyTranslations();
    
    // Guardar preferencia
    localStorage.setItem('preferredLanguage', newLang);
    
    console.log(`✅ Idioma cambiado a: ${newLang}`);
  }
  
  /**
   * Obtiene el idioma actual
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Obtiene el idioma preferido del usuario
   */
  getPreferredLanguage() {
    const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt'];
    const DEFAULT_LANGUAGE = 'es';
    
    // 1. Buscar en localStorage
    const stored = localStorage.getItem('preferredLanguage');
    if (SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }
    
    // 2. Buscar en navegador
    const browserLang = (navigator.language || '').split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }
    
    // 3. Usar idioma por defecto
    return DEFAULT_LANGUAGE;
  }
  
  /**
   * Inicializa el sistema de traducciones
   */
  async init() {
    const preferredLang = this.getPreferredLanguage();
    await this.loadLanguage(preferredLang);
    console.log('✅ Translation system initialized');
  }
}

// Crear instancia global
window.translationLoader = new TranslationLoader();

// Mantener compatibilidad con código existente
if (!window.translationManager) {
  window.translationManager = {
    translate: (key, vars) => window.translationLoader.translate(key, vars),
    applyLanguage: (lang) => window.translationLoader.changeLanguage(lang),
    getCurrentLanguage: () => window.translationLoader.getCurrentLanguage(),
    register: (el, key, target, opts) => window.translationLoader.register(el, key, target, opts),
    init: () => window.translationLoader.init()
  };
}

console.log('✅ TranslationLoader initialized');
