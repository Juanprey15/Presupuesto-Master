/** Constantes de la plantilla: versión, pestañas, grillas, defectos y paleta. */
const CONFIG = {
  VERSION: '2.0.0',
  HOJAS: {
    inicio: 'Inicio',
    panel: 'Panel',
    gastos: 'Gastos',
    ingresos: 'Ingresos',
    configuracion: 'Configuración',
    listas: '_Listas',
  },
  MESES: 12,
  /** Primera fila de datos de Gastos e Ingresos (fila 1: meses; fila 2: Presup. / Real). */
  FILA_DATOS: 3,
  FILAS_GASTOS: 200,
  FILAS_INGRESOS: 20,
  /** Puntos de avance por encima del avance del mes desde los que un gasto variable "va rápido". */
  TOLERANCIA_RITMO: 0.1,
  /** Columnas fijas de cada grilla: clave interna -> encabezado visible, en orden de columna. */
  COLUMNAS: {
    gastos: {
      gasto: 'Gasto', codigo: 'Pago', grupo: 'Grupo', parteDe: 'Parte de', tipo: 'Tipo',
      comportamiento: 'Comportamiento', persona: 'Persona', pago: 'Forma de pago',
    },
    ingresos: { fuente: 'Fuente', persona: 'Persona', moneda: 'Moneda' },
    cambios: { mes: 'Mes del ingreso', fecha: 'Fecha', dolares: 'Dólares', tasa: 'Tasa', pesos: 'En pesos' },
  },
  // Configuración regional con que se entrega la planilla (moneda, fechas y separadores que ve el usuario).
  LOCALE: 'es_CO',
  ZONA_HORARIA: 'America/Bogota',
  /** Configuración inicial de una planilla nueva sin datos de ejemplo. */
  DEFECTOS: {
    general: { nombre: 'Mi familia', ano: new Date().getFullYear(), mesInicio: 1, moneda: 'COP', segundaMoneda: 'USD', copiar: true, tolerancia: 0.1, usarSegunda: false },
    personas: [{ nombre: 'Persona 1', activa: true }, { nombre: 'Persona 2', activa: true }],
    formasPago: [{ nombre: 'Efectivo', activa: true }, { nombre: 'Digital', activa: true }],
    tipos: [
      { letra: 'E', nombre: 'Esenciales', meta: 0.5 }, { letra: 'A', nombre: 'Ahorro', meta: 0.2 },
      { letra: 'I', nombre: 'Inversión', meta: 0.1 }, { letra: 'N', nombre: 'No esenciales', meta: 0.2 },
    ],
    grupos: ['Hogar', 'Alimentación', 'Transporte', 'Personal', 'Diversión', 'Ahorro e inversión']
      .map((nombre, i) => ({ nombre, orden: i + 1, activo: true })),
  },
  PALETA: {
    ground: '#E8E8E3', surface: '#FFFFFF', ink: '#23262A', muted: '#565C61',
    primary: '#3F5566', accent: '#6F7F3A', deep: '#222C33', line: '#D2D3CC',
    // Alerta (excedido, va rápido); siempre acompañada de texto.
    warn: '#8A4B12',
  },
  // Tonos suaves para teñir los meses según la forma de pago; el texto (ink) pasa AA sobre todos.
  PALETA_PAGO: [
    ['Musgo', '#E1E8CF'], ['Pizarra', '#D9E2EA'], ['Arena', '#EFE5D3'], ['Malva', '#E8DDE6'],
    ['Cielo', '#D8EAF0'], ['Durazno', '#F4DFD2'], ['Salvia', '#DCE8DF'], ['Gris', '#E4E4E0'],
  ],
  SIN_COLOR: 'Sin color',
};
