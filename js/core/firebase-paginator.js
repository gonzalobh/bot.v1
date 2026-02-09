// ═══════════════════════════════════════════════════════════════════
// Firebase Paginator - Paginación optimizada para Firebase
// ═══════════════════════════════════════════════════════════════════

class FirebasePaginator {
  constructor(ref, pageSize = 20, orderBy = 'key') {
    this.ref = ref;
    this.pageSize = pageSize;
    this.orderBy = orderBy;
    this.lastKey = null;
    this.firstKey = null;
    this.hasMore = true;
    this.hasPrevious = false;
    this.currentPage = 0;
    this.totalItems = null;
  }
  
  /**
   * Carga la siguiente página
   */
  async loadNextPage() {
    if (!this.hasMore) {
      console.log('📄 No hay más páginas');
      return [];
    }
    
    let query = this.ref.limitToLast(this.pageSize + 1);
    
    // Si ya cargamos una página, empezar desde la última key
    if (this.lastKey) {
      query = query.endBefore(this.lastKey);
    }
    
    const snap = await query.once('value');
    const data = snap.val() || {};
    const entries = Object.entries(data);
    
    // Si trajimos pageSize + 1, hay más páginas
    if (entries.length > this.pageSize) {
      this.hasMore = true;
      this.firstKey = entries[0][0];
      this.lastKey = entries[this.pageSize][0];
      this.currentPage++;
      return entries.slice(0, this.pageSize); // Eliminar el elemento extra
    } else {
      this.hasMore = false;
      if (entries.length > 0) {
        this.firstKey = entries[0][0];
        this.lastKey = entries[entries.length - 1][0];
      }
      if (entries.length > 0) this.currentPage++;
      return entries;
    }
  }
  
  /**
   * Carga la página anterior
   */
  async loadPreviousPage() {
    if (!this.hasPrevious || !this.firstKey) {
      console.log('📄 No hay páginas anteriores');
      return [];
    }
    
    const query = this.ref
      .startAfter(this.firstKey)
      .limitToFirst(this.pageSize + 1);
    
    const snap = await query.once('value');
    const data = snap.val() || {};
    const entries = Object.entries(data);
    
    if (entries.length > this.pageSize) {
      this.hasPrevious = true;
      this.firstKey = entries[0][0];
      this.lastKey = entries[this.pageSize - 1][0];
      this.hasMore = true;
      this.currentPage--;
      return entries.slice(0, this.pageSize);
    } else {
      this.hasPrevious = false;
      if (entries.length > 0) {
        this.firstKey = entries[0][0];
        this.lastKey = entries[entries.length - 1][0];
      }
      if (entries.length > 0) this.currentPage--;
      return entries;
    }
  }
  
  /**
   * Carga los primeros elementos (primera página)
   */
  async loadFirstPage() {
    this.reset();
    return this.loadNextPage();
  }
  
  /**
   * Obtiene el total de elementos (hace una consulta adicional)
   */
  async getTotalCount() {
    if (this.totalItems !== null) {
      return this.totalItems;
    }
    
    const snap = await this.ref.once('value');
    this.totalItems = snap.numChildren();
    return this.totalItems;
  }
  
  /**
   * Reinicia el paginador
   */
  reset() {
    this.lastKey = null;
    this.firstKey = null;
    this.hasMore = true;
    this.hasPrevious = false;
    this.currentPage = 0;
    this.totalItems = null;
  }
  
  /**
   * Obtiene información del estado actual
   */
  getState() {
    return {
      currentPage: this.currentPage,
      hasMore: this.hasMore,
      hasPrevious: this.hasPrevious,
      pageSize: this.pageSize,
      totalItems: this.totalItems
    };
  }
}

/**
 * Helper para crear paginadores fácilmente
 */
class PaginatorFactory {
  constructor() {
    this.paginators = {};
  }
  
  /**
   * Crea o obtiene un paginador
   */
  get(name, ref, pageSize = 20) {
    if (!this.paginators[name]) {
      this.paginators[name] = new FirebasePaginator(ref, pageSize);
      console.log(`✅ Paginador creado: ${name}`);
    }
    return this.paginators[name];
  }
  
  /**
   * Reinicia un paginador
   */
  reset(name) {
    if (this.paginators[name]) {
      this.paginators[name].reset();
      console.log(`🔄 Paginador reiniciado: ${name}`);
    }
  }
  
  /**
   * Elimina un paginador
   */
  remove(name) {
    if (this.paginators[name]) {
      delete this.paginators[name];
      console.log(`🗑️ Paginador eliminado: ${name}`);
    }
  }
  
  /**
   * Reinicia todos los paginadores
   */
  resetAll() {
    Object.keys(this.paginators).forEach(name => {
      this.paginators[name].reset();
    });
    console.log('🔄 Todos los paginadores reiniciados');
  }
}

// Instancia global
window.paginatorFactory = new PaginatorFactory();

console.log('✅ FirebasePaginator initialized');
