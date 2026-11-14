/** Constantes de la plantilla: versión, pestañas y paleta. */
const CONFIG = {
  VERSION: '2.0.0-dev',
  HOJAS: {
    inicio: 'Inicio',
    panel: 'Panel',
    hormiga: 'Hormiga',
    movimientos: 'Movimientos',
    ingresos: 'Ingresos',
    presupuesto: 'Presupuesto',
    tarjeta: 'Compras con tarjeta',
    configuracion: 'Configuración',
    listas: '_Listas',
  },
  /** Encabezados de cada pestaña de datos: clave interna -> encabezado visible, en orden de columna. */
  COLUMNAS: {
    movimientos: {
      fecha: 'Fecha', monto: 'Monto', moneda: 'Moneda', subcategoria: 'Subcategoría', pago: 'Pagó',
      formaPago: 'Forma de pago', tienda: 'Tienda', paraQuien: 'Para quién', nota: 'Nota', origen: 'Origen',
    },
    ingresos: { fecha: 'Fecha', persona: 'Persona', fuente: 'Fuente', monto: 'Monto', moneda: 'Moneda' },
    presupuestoBase: { categoria: 'Categoría', monto: 'Monto', vigenteDesde: 'Vigente desde' },
    ajustes: { mes: 'Mes', categoria: 'Categoría', monto: 'Monto' },
    tarjeta: {
      fecha: 'Fecha', monto: 'Monto', tarjeta: 'Tarjeta', subcategoria: 'Subcategoría', tienda: 'Tienda',
      cuotas: 'Cuotas', nota: 'Nota',
    },
  },
  SEPARADOR: ' › ',
  // Configuración regional con que se entrega la planilla (moneda, fechas y separadores que ve el usuario).
  LOCALE: 'es_CO',
  /** Configuración inicial de una planilla nueva sin datos de ejemplo. */
  DEFECTOS: {
    personas: ['Persona 1', 'Persona 2'],
    grupos: ['Hogar', 'Alimentación', 'Transporte', 'Personal', 'Diversión', 'Ahorro e inversión'],
    categorias: [
      ['Hogar', 'Arriendo o cuota', 'E', 'fija'], ['Hogar', 'Servicios públicos', 'E', 'fija'],
      ['Hogar', 'Internet y celular', 'E', 'fija'], ['Alimentación', 'Mercado', 'E', 'variable'],
      ['Alimentación', 'Antojos', 'N', 'variable'], ['Transporte', 'Transporte', 'E', 'variable'],
      ['Personal', 'Salud', 'E', 'variable'], ['Personal', 'Ropa', 'N', 'variable'],
      ['Personal', 'Suscripciones', 'N', 'fija'], ['Personal', 'Gastos bancarios', 'N', 'variable'],
      ['Diversión', 'Salidas', 'N', 'variable'], ['Ahorro e inversión', 'Ahorro', 'A', 'fija'],
      ['Ahorro e inversión', 'Inversión', 'I', 'fija'],
    ].map(([grupo, categoria, tipo, comportamiento]) => ({ grupo, categoria, tipo, comportamiento, activa: true })),
    subcategorias: [
      ['Arriendo o cuota', 'Arriendo'], ['Servicios públicos', 'Luz'], ['Servicios públicos', 'Agua'],
      ['Servicios públicos', 'Gas'], ['Internet y celular', 'Internet'], ['Internet y celular', 'Celular'],
      ['Mercado', 'Mercado'], ['Mercado', 'Carnes'], ['Mercado', 'Frutas y verduras'], ['Mercado', 'Aseo'],
      ['Antojos', 'Café', true], ['Antojos', 'Snacks y golosinas', true], ['Antojos', 'Domicilios', true],
      ['Antojos', 'Compras por impulso', true], ['Transporte', 'Gasolina'], ['Transporte', 'Transporte público'],
      ['Transporte', 'Taxi y apps de transporte', true], ['Salud', 'Medicamentos'], ['Salud', 'Citas'],
      ['Ropa', 'Ropa'], ['Suscripciones', 'Streaming'], ['Gastos bancarios', 'Comisiones bancarias', true],
      ['Gastos bancarios', 'Cuota de manejo'], ['Salidas', 'Restaurantes'], ['Salidas', 'Cine'],
      ['Salidas', 'Propinas', true], ['Ahorro', 'Ahorro'], ['Inversión', 'Inversión'],
    ].map(([categoria, subcategoria, hormiga = false]) => ({ categoria, subcategoria, activa: true, hormiga })),
    formasPago: ['Efectivo', 'Digital'],
    tiendas: [],
    tarjetas: [],
    monedas: [{ moneda: 'COP', principal: true }, { moneda: 'USD', principal: false }],
    tasas: [],
    metas: [{ tipo: 'E', pct: 0.5 }, { tipo: 'A', pct: 0.2 }, { tipo: 'I', pct: 0.1 }, { tipo: 'N', pct: 0.2 }],
    hormiga: { montoMaximo: 30000, comprasPorMes: 3, mesesSeguidos: 3 },
  },
  PALETA: {
    ground: '#E8E8E3', surface: '#FFFFFF', ink: '#23262A', muted: '#565C61',
    primary: '#3F5566', accent: '#6F7F3A', deep: '#222C33', line: '#D2D3CC',
  },
};
