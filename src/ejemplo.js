/**
 * Datos de ejemplo ficticios (familia Ana, Luis y Sol, enero a marzo de 2026).
 * Cada caso cubre una regla del Panel; los resultados esperados están en tests/oraculo.test.js.
 * En `meses`, cada par es [presupuesto, real]; null es una celda sin escribir.
 */
const EJEMPLO = (() => {
  const claves = ['gasto', 'grupo', 'parteDe', 'tipo', 'comportamiento', 'persona', 'pago', 'meses'];
  const gastos = [
    ['Arriendo', 'Casa', '', 'E', 'fijo', 'Ana', 'Digital', [[1500000, 1500000], [null, 1500000], [1600000, null]]],
    // Gasto con partes: su presupuesto es la suma de las partes; el real se escribe en el gasto.
    ['Mercado', 'Casa', '', 'E', 'variable', '', '', [[null, 900000], [null, 1100000], [null, 300000]]],
    ['Carnes', 'Casa', 'Mercado', '', '', 'Ana', 'Digital', [[500000, null]]],
    ['Frutas', 'Casa', 'Mercado', '', '', 'Luis', 'Efectivo', [[300000, null]]],
    ['Aseo', 'Casa', 'Mercado', '', '', 'Ana', 'Digital', [[200000, null], [250000, null]]],
    ['Colegio Sol', 'Sol', '', 'E', 'fijo', 'Luis', 'Digital', [[800000, 800000], [null, 400000]]],
    ['Salidas', 'Diversión', '', 'N', 'variable', 'Luis', 'Efectivo', [[300000, 250000], [null, null], [null, 200000]]],
    ['Ahorro', 'Ahorro', '', 'A', 'fijo', 'Ana', 'Digital', [[400000, 400000], [null, 400000]]],
    // Filas defectuosas: grupo que no existe y presupuesto escrito como texto; parte de un gasto inexistente.
    ['Gimnasio', 'Inexistente', '', 'N', 'fijo', 'Luis', 'Digital', [['abc', 100000]]],
    ['Propinas', 'Diversión', 'Restaurantes', 'N', '', 'Luis', 'Efectivo', [[50000, 50000]]],
  ].map((g) => Object.fromEntries(claves.map((k, i) => [k, g[i]])));

  return {
    config: {
      general: { nombre: 'Familia Prueba', ano: 2026, mesInicio: 1, moneda: 'COP', segundaMoneda: 'USD', copiar: true, tolerancia: 0.1 },
      personas: [['Ana', true], ['Luis', true], ['Sol', false]].map(([nombre, activa]) => ({ nombre, activa })),
      formasPago: [['Efectivo', true], ['Digital', true], ['Tarjeta Azul', false]].map(([nombre, activa]) => ({ nombre, activa })),
      tipos: [['E', 'Esenciales', 0.5], ['A', 'Ahorro', 0.2], ['I', 'Inversión', 0.1], ['N', 'No esenciales', 0.2]]
        .map(([letra, nombre, meta]) => ({ letra, nombre, meta })),
      grupos: ['Casa', 'Sol', 'Diversión', 'Ahorro'].map((nombre, i) => ({ nombre, orden: i + 1, activo: true })),
    },
    gastos,
    ingresos: [
      { fuente: 'Sueldo Luis', persona: 'Luis', moneda: 'USD', meses: [[2000, 2000], [null, 2000]] },
      { fuente: 'Ventas Ana', persona: 'Ana', moneda: 'COP', meses: [[3000000, 2700000], [null, 3200000]] },
    ],
    tasaPlan: [4000, null, 3900],
    // El segundo cambio de febrero se hace el 2 de marzo: el mes del ingreso se elige a mano.
    cambios: [
      { mes: 0, fecha: '2026-01-30', dolares: 2000, tasa: 4100 },
      { mes: 1, fecha: '2026-02-20', dolares: 1000, tasa: 4200 },
      { mes: 1, fecha: '2026-03-02', dolares: 500, tasa: 4300 },
    ],
  };
})();
