/**
 * Conversión de la copia familiar (meses extraídos con extraerMes) a los datos de la hoja anual, con la tabla
 * de equivalencias que decide la familia. Reglas: docs/specs/2026-11-22-migracion-design.md.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { MESES_VIEJOS } = require('./extraer');

const SIN_DETALLAR = 'Sin detallar';

/** CONFIG y el oráculo de src/, cargados como en Apps Script. */
function cargarSrc() {
  const ctx = vm.createContext({});
  for (const f of ['config.js', 'oraculo.js']) {
    const ruta = path.join(__dirname, '..', '..', 'src', f);
    vm.runInContext(fs.readFileSync(ruta, 'utf8'), ctx, { filename: ruta });
  }
  return vm.runInContext('({ CONFIG, calcularMes })', ctx);
}

const sumar = (xs) => xs.reduce((a, b) => a + b, 0);
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const unicos = (xs) => [...new Set(xs.filter((x) => x))];

/** Especificaciones de gasto en orden de primera aparición; los renglones sin entrada son gastos propios. */
function especificaciones(meses, tabla) {
  const porDesc = new Map();
  for (const e of tabla.gastos) for (const de of e.de) porDesc.set(de, e);
  const orden = [];
  for (const m of meses) {
    for (const r of m.renglones) {
      if (!porDesc.has(r.desc)) porDesc.set(r.desc, { gasto: r.desc, de: [r.desc] });
      const e = porDesc.get(r.desc);
      if (!orden.includes(e)) orden.push(e);
    }
  }
  return orden;
}

/** Ítems del desglose de un mes, corregidos, renombrados, sumados por nombre y sin ceros. */
function itemsDesglose(m, i, e) {
  const vistos = {};
  const items = new Map();
  for (const d of m.desgloses[e.desglose] || []) {
    vistos[d.item] = (vistos[d.item] || 0) + 1;
    const corr = (e.correcciones || []).find((c) => MESES_VIEJOS.indexOf(c.mes) === i && c.item === d.item && c.ocurrencia === vistos[d.item]);
    const nombre = corr ? corr.parte : (e.partes && e.partes[d.item]) || capital(d.item.trim());
    const previo = items.get(nombre);
    items.set(nombre, { parte: nombre, pago: previo ? previo.pago : d.pago, valor: (previo ? previo.valor : 0) + d.valor });
  }
  return [...items.values()].filter((x) => x.valor !== 0);
}

/** Partes de un gasto en un mes: por renglón si la tabla lo pide; si no, el desglose si cabe en lo presupuestado,
 * o una parte por forma de pago. */
function partesDelMes(m, i, e, renglones) {
  if (e.partesPorRenglon) {
    const nombre = (r) => e.partesPorRenglon[r.desc] || r.desc;
    return unicos(renglones.map(nombre)).map((parte) => {
      const rs = renglones.filter((r) => nombre(r) === parte);
      return { parte, pago: rs[0].pago, persona: rs[0].persona, valor: sumar(rs.map((r) => r.presupuesto || 0)) };
    });
  }
  const presupuesto = sumar(renglones.map((r) => r.presupuesto || 0));
  const personaDe = (pago) => (renglones.find((r) => r.pago === pago) || renglones[0]).persona;
  const items = e.desglose ? itemsDesglose(m, i, e) : [];
  const s = sumar(items.map((x) => x.valor));
  if (s > 0 && s <= presupuesto) {
    const partes = items.map((x) => ({ ...x, persona: personaDe(x.pago) }));
    if (s < presupuesto) {
      const mayor = renglones.reduce((a, r) => ((r.presupuesto || 0) > (a.presupuesto || 0) ? r : a));
      partes.push({ parte: SIN_DETALLAR, pago: mayor.pago, persona: mayor.persona, valor: presupuesto - s });
    }
    return partes;
  }
  return unicos(renglones.filter((r) => r.presupuesto).map((r) => r.pago)).map((pago) => ({
    parte: pago, pago, persona: personaDe(pago),
    valor: sumar(renglones.filter((r) => r.pago === pago).map((r) => r.presupuesto || 0)),
  }));
}

function convertir(meses, tabla) {
  const { CONFIG } = cargarSrc();
  const grupoDe = (e, r) => e.grupo || (tabla.grupos[r.grupo] ?? r.grupo);
  const gastos = [];
  for (const e of especificaciones(meses, tabla)) {
    const porMes = meses.map((m) => m.renglones.filter((r) => e.de.includes(r.desc)));
    const ultimo = porMes.flat().pop();
    const conPartes = Boolean(e.desglose || e.partesPorRenglon) || porMes.some((rs) => rs.length > 1);
    const base = { gasto: e.gasto, grupo: grupoDe(e, ultimo), parteDe: '', tipo: ultimo.tipo, comportamiento: e.comportamiento || 'fijo' };
    const pagados = (rs) => (rs.some((r) => r.pagado !== null) ? sumar(rs.map((r) => r.pagado || 0)) : null);
    if (!conPartes) {
      gastos.push({ ...base, persona: ultimo.persona, pago: ultimo.pago,
        meses: porMes.map((rs) => (rs.length ? [sumar(rs.map((r) => r.presupuesto || 0)), pagados(rs)] : [0, null])) });
      continue;
    }
    gastos.push({ ...base, persona: '', pago: '', meses: porMes.map((rs) => [null, rs.length ? pagados(rs) : null]) });
    const partes = new Map();
    porMes.forEach((rs, i) => {
      if (!rs.length) return;
      for (const p of partesDelMes(meses[i], i, e, rs)) {
        if (!partes.has(p.parte)) {
          partes.set(p.parte, { gasto: p.parte, grupo: base.grupo, parteDe: e.gasto, tipo: '', comportamiento: '',
            persona: p.persona, pago: p.pago, meses: meses.map(() => [0, null]) });
        }
        partes.get(p.parte).meses[i] = [p.valor, null];
      }
    });
    gastos.push(...partes.values());
  }

  const segunda = tabla.general.segundaMoneda;
  const fuentes = new Map();
  meses.forEach((m, i) => m.ingresos.forEach((x) => {
    const clave = `${x.persona}|${x.fuente}`;
    if (!fuentes.has(clave)) {
      fuentes.set(clave, { fuente: x.fuente, persona: x.persona, moneda: x.dolares !== null ? segunda : tabla.general.moneda,
        meses: meses.map(() => [0, null]) });
    }
    const v = x.dolares !== null ? x.dolares : x.valor;
    fuentes.get(clave).meses[i] = v === null ? [0, null] : [v, v];
  }));
  const ingresos = [...fuentes.values()];
  const dolaresDelMes = (i) => sumar(ingresos.filter((f) => f.moneda === segunda).map((f) => f.meses[i][1] || 0));

  const renglones = meses.flatMap((m) => m.renglones);
  const usados = unicos(gastos.map((g) => g.grupo));
  return {
    config: {
      general: { ...tabla.general },
      personas: unicos([...renglones.map((r) => r.persona), ...meses.flatMap((m) => m.ingresos.map((x) => x.persona))])
        .map((nombre) => ({ nombre, activa: true })),
      formasPago: unicos([...renglones.map((r) => r.pago), ...gastos.map((g) => g.pago)]).map((nombre) => ({ nombre, activa: true })),
      tipos: CONFIG.DEFECTOS.tipos.map((t) => ({ ...t })),
      grupos: unicos([...Object.values(tabla.grupos), ...usados]).map((nombre, k) => ({ nombre, orden: k + 1, activo: true })),
    },
    gastos,
    ingresos,
    tasaPlan: meses.map((m) => m.tasa),
    cambios: meses.map((m, i) => ({ mes: i, fecha: '', dolares: dolaresDelMes(i), tasa: m.tasa }))
      .filter((c) => c.dolares > 0 && c.tasa !== null),
  };
}

/** Diferencias de presupuesto, pagado e ingreso total por mes entre la hoja vieja y los datos convertidos. */
function compararTotales(meses, datos) {
  const { calcularMes } = cargarSrc();
  const diferencias = [];
  meses.forEach((m, i) => {
    const c = calcularMes(datos, i, new Date(2000, 0, 1));
    const nuevos = { presupuesto: c.presupuestado, pagado: c.gastado, ingreso: c.ingresos.mostrado };
    for (const campo of ['presupuesto', 'pagado', 'ingreso']) {
      if (Math.abs(nuevos[campo] - m.totales[campo]) > 1e-6) diferencias.push({ mes: MESES_VIEJOS[i], campo, viejo: m.totales[campo], nuevo: nuevos[campo] });
    }
  });
  return diferencias;
}

/** Tabla de equivalencias inicial para revisar: pares "X Efectivo"/"X Digital" agrupados en X. */
function borrador(meses, ano) {
  const titulos = unicos(meses.flatMap((m) => Object.keys(m.desgloses)));
  const gastos = new Map();
  for (const r of meses.flatMap((m) => m.renglones)) {
    const par = r.desc.match(/^(.*) (Efectivo|Digital)$/);
    if (!par) continue;
    const x = par[1];
    if (!gastos.has(x)) gastos.set(x, { gasto: x, de: [], ...(titulos.includes(x) ? { desglose: x } : {}) });
    if (!gastos.get(x).de.includes(r.desc)) gastos.get(x).de.push(r.desc);
  }
  return {
    general: { nombre: 'Mi familia', ano, mesInicio: 1, moneda: 'COP', segundaMoneda: 'USD', usarSegunda: true, copiar: true, tolerancia: 0.1 },
    grupos: Object.fromEntries(unicos(meses.flatMap((m) => m.renglones.map((r) => r.grupo))).map((g) => [g, g])),
    gastos: [...gastos.values()].map(({ gasto, de, desglose }) => (desglose ? { gasto, de, desglose } : { gasto, de })),
  };
}

module.exports = { convertir, compararTotales, borrador };
