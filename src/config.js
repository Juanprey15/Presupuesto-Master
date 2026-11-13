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
  PALETA: {
    ground: '#E8E8E3', surface: '#FFFFFF', ink: '#23262A', muted: '#565C61',
    primary: '#3F5566', accent: '#6F7F3A', deep: '#222C33', line: '#D2D3CC',
  },
};
