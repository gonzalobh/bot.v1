// ═══════════════════════════════════════════════════════════════════
// Listeners Manager - Gestión optimizada de listeners de Firebase
// ═══════════════════════════════════════════════════════════════════

class ListenersManager {
  constructor() {
    this.activeListeners = {};
    this.staticDataCache = {}; // Cache para datos estáticos
  }
  
  /**
   * Activa un listener de Firebase
   * @param {string} name - Nombre único del listener
   * @param {firebase.database.Reference} ref - Referencia de Firebase
   * @param {Function} callback - Función callback
   * @param {boolean} realtime - Si es true usa .on(), si es false usa .once()
   */
  activate(name, ref, callback, realtime = true) {
    if (this.activeListeners[name]) {
      console.warn(`⚠️ Listener "${name}" ya está activo`);
      return;
    }
    
    if (realtime) {
      // Listener en tiempo real con .on()
      ref.on('value', callback);
      this.activeListeners[name] = { ref, callback, type: 'realtime' };
      console.log(`✅ Listener activado (tiempo real): ${name}`);
    } else {
      // Carga única con .once()
      ref.once('value').then(callback);
      console.log(`✅ Datos cargados (una vez): ${name}`);
    }
  }
  
  /**
   * Desactiva un listener específico
   */
  deactivate(name) {
    const listener = this.activeListeners[name];
    if (!listener) return;
    
    if (listener.type === 'realtime') {
      listener.ref.off('value', listener.callback);
      console.log(`🛑 Listener desactivado: ${name}`);
    }
    
    delete this.activeListeners[name];
  }
  
  /**
   * Desactiva todos los listeners
   */
  deactivateAll() {
    Object.keys(this.activeListeners).forEach(name => {
      this.deactivate(name);
    });
    console.log('🛑 Todos los listeners desactivados');
  }
  
  /**
   * Carga datos estáticos una sola vez y los cachea
   */
  async loadStatic(name, ref) {
    if (this.staticDataCache[name]) {
      console.log(`📦 Datos cargados desde caché: ${name}`);
      return this.staticDataCache[name];
    }
    
    const snap = await ref.once('value');
    const data = snap.val();
    this.staticDataCache[name] = data;
    console.log(`✅ Datos estáticos cargados: ${name}`);
    return data;
  }
  
  /**
   * Limpia la caché de datos estáticos
   */
  clearCache(name) {
    if (name) {
      delete this.staticDataCache[name];
    } else {
      this.staticDataCache = {};
    }
  }
  
  /**
   * Obtiene información de listeners activos
   */
  getActiveListeners() {
    return Object.keys(this.activeListeners);
  }
  
  /**
   * Muestra estadísticas de uso
   */
  logStats() {
    console.group('📊 Listeners Manager Stats');
    console.log('Listeners activos:', Object.keys(this.activeListeners).length);
    console.log('Datos en caché:', Object.keys(this.staticDataCache).length);
    console.log('Listeners:', this.getActiveListeners());
    console.groupEnd();
  }
}

// Instancia global
window.listenersManager = new ListenersManager();

console.log('✅ ListenersManager initialized');
