/**
 * Extracción de una pestaña de mes de la copia familiar (derivada de la 1.4): tasa del dólar, renglones de
 * gastos con su grupo, desgloses laterales, ingresos y totales de la propia hoja.
 */

const MESES_VIEJOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TITULOS_DESGLOSE = ['Servicios Públicos', 'Suscripciones', 'Mercado'];
const ENCABEZADOS_DESGLOSE = ['Item', 'Descripción', 'Tienda'];
const FIN_DESGLOSE = 'Restante de lo presupuestado';

const fila = (a1) => Number(a1.replace(/^[A-Z]+/, ''));
const columna = (a1) => a1.replace(/\d+$/, '');
const numero = (v) => (typeof v === 'number' ? v : null);
const limpio = (v) => (typeof v === 'string' ? v.trim() : v);

function extraerMes(celdas) {
  const val = (a1) => (celdas[a1] ? celdas[a1].valor : '');
  const filasDe = (col, prueba) => Object.keys(celdas).filter((a1) => columna(a1) === col && prueba(limpio(val(a1)))).map(fila);
  const primera = (col, texto) => Math.min(...filasDe(col, (v) => v === texto));

  const filaUsd = primera('B', 'USD');
  const tasa = Number.isFinite(filaUsd) ? numero(val(`C${filaUsd}`)) : null;

  const desde = primera('G', 'Descripción');
  const hasta = primera('G', 'Total Gastos');
  for (const [fila, texto] of [[desde, 'Descripción'], [hasta, 'Total Gastos']]) {
    if (!Number.isFinite(fila)) throw new Error(`La pestaña no tiene "${texto}" en la columna G.`);
  }
  const renglones = [];
  let grupo = '';
  for (let i = desde + 1; i < hasta; i++) {
    const desc = limpio(val(`G${i}`));
    if (!desc) continue;
    if (!['H', 'I', 'J', 'K', 'L'].some((c) => val(`${c}${i}`) !== '')) { grupo = desc; continue; }
    renglones.push({
      grupo, desc, persona: limpio(val(`H${i}`)), tipo: limpio(val(`I${i}`)), pago: limpio(val(`J${i}`)),
      presupuesto: numero(val(`K${i}`)), pagado: numero(val(`L${i}`)),
    });
  }

  const desgloses = {};
  for (const titulo of TITULOS_DESGLOSE) {
    const inicio = primera('N', titulo);
    if (!Number.isFinite(inicio)) continue;
    const items = [];
    let enItems = false;
    for (let i = inicio + 1; i < inicio + 40; i++) {
      const n = limpio(val(`N${i}`));
      if (n === FIN_DESGLOSE) break;
      if (ENCABEZADOS_DESGLOSE.includes(n)) { enItems = true; continue; }
      if (enItems && n !== '') items.push({ item: String(n), pago: limpio(val(`P${i}`)), valor: numero(val(`Q${i}`)) || 0 });
    }
    desgloses[titulo] = items;
  }

  const ingresos = filasDe('B', (v) => /^F\d+$/.test(String(v))).sort((a, b) => a - b).map((i) => {
    const m = (celdas[`E${i}`] ? celdas[`E${i}`].formula : '').match(/^=?\s*([\d.]+)\s*\*\s*\$?C\$?4\s*$/);
    return { persona: limpio(val(`C${i}`)), fuente: limpio(val(`D${i}`)), valor: numero(val(`E${i}`)), dolares: m ? Number(m[1]) : null };
  });

  const filaTotalIngreso = primera('B', 'Total');
  return {
    tasa, renglones, desgloses, ingresos,
    totales: {
      presupuesto: numero(val(`K${hasta}`)) || 0,
      pagado: numero(val(`L${hasta}`)) || 0,
      ingreso: Number.isFinite(filaTotalIngreso) ? numero(val(`E${filaTotalIngreso}`)) || 0 : 0,
    },
  };
}

module.exports = { extraerMes, MESES_VIEJOS };
