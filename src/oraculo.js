/**
 * Oráculo: las reglas del Panel calculadas en JavaScript sobre los datos de la hoja anual.
 * Las fórmulas del Panel deben dar exactamente estos números (ver verificar.js).
 */

const SIN_GRUPO = 'Sin grupo';

const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const sumar = (xs) => xs.reduce((a, b) => a + b, 0);

/** Valor de una celda de la grilla: k = 0 presupuesto, 1 real. */
function celda(fila, i, k) {
  const par = fila.meses[i];
  return par && par[k] !== undefined ? par[k] : null;
}

/** Presupuesto tal como queda en la celda: lo escrito o, si no hay nada, la copia del mes anterior. */
function presupuestoEnCelda(datos, fila, i) {
  const escrito = celda(fila, i, 0);
  if (escrito !== null) return escrito;
  return i > 0 && datos.config.general.copiar ? presupuestoEnCelda(datos, fila, i - 1) : null;
}

const esPadre = (datos, g) => g.gasto !== '' && g.parteDe === '' && datos.gastos.some((o) => o.parteDe === g.gasto);
const esParte = (datos, g) => g.parteDe !== '' && datos.gastos.some((o) => o.parteDe === '' && o.gasto === g.parteDe);

/** Presupuesto del mes i de un gasto; el de un gasto con partes es la suma de sus partes. */
function presupuestoEfectivo(datos, g, i) {
  if (esPadre(datos, g)) {
    return sumar(datos.gastos.filter((o) => o.parteDe === g.gasto).map((o) => presupuestoEfectivo(datos, o, i)));
  }
  return numero(presupuestoEnCelda(datos, g, i)) || 0;
}

/** Tasa para planear del mes i; se copia siempre del mes anterior si no está escrita. */
function tasaPlanMes(datos, i) {
  const v = numero(datos.tasaPlan[i]);
  if (v !== null) return v;
  return i > 0 ? tasaPlanMes(datos, i - 1) : null;
}

function fraccionDelMes(datos, i, hoy) {
  const { ano, mesInicio } = datos.config.general;
  const inicio = new Date(ano, mesInicio - 1 + i, 1);
  const fin = new Date(ano, mesInicio + i, 1);
  if (fin <= hoy) return 1;
  if (inicio > hoy) return 0;
  return hoy.getDate() / new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
}

function estadoDe(comportamiento, presupuesto, real, fraccion) {
  if (real === null) return 'Pendiente';
  if (real > presupuesto) return 'Excedido';
  if (real === presupuesto) return 'Pagado';
  if (comportamiento !== 'variable') return 'Pago parcial';
  return presupuesto > 0 && real / presupuesto > fraccion + CONFIG.TOLERANCIA_RITMO ? 'Va rápido' : 'En ritmo';
}

/** Gastos que forman filas del Panel: los que no son partes (una parte huérfana cuenta como gasto propio). */
const gastosPropios = (datos) => datos.gastos.filter((g) => g.gasto !== '' && !esParte(datos, g));
/** Gastos que llevan presupuesto propio por persona y forma de pago: todos menos los gastos con partes. */
const gastosConPresupuesto = (datos) => datos.gastos.filter((g) => g.gasto !== '' && !esPadre(datos, g));

function ingresosDelMes(datos, i) {
  const segunda = datos.config.general.segundaMoneda;
  const tasaPlan = tasaPlanMes(datos, i);
  const t = tasaPlan || 0;
  const fuentes = datos.ingresos.map((f) => ({
    f, enDolares: f.moneda === segunda,
    p: numero(presupuestoEnCelda(datos, f, i)) || 0, r: numero(celda(f, i, 1)),
  }));
  const dolares = fuentes.filter((x) => x.enDolares);
  const enPesos = fuentes.filter((x) => !x.enDolares);
  const usdPlan = sumar(dolares.map((x) => x.p));
  const usdReal = sumar(dolares.map((x) => x.r || 0));
  const cambios = datos.cambios.filter((c) => c.mes === i && numero(c.dolares) !== null && numero(c.tasa) !== null);
  const cambiados = sumar(cambios.map((c) => c.dolares));
  const pesosCambiados = sumar(cambios.map((c) => c.dolares * c.tasa));
  const usdPorCambiar = Math.max(0, usdReal - cambiados);
  const realUsdEnPesos = pesosCambiados + usdPorCambiar * t;
  const planeado = usdPlan * t + sumar(enPesos.map((x) => x.p));
  const real = realUsdEnPesos + sumar(enPesos.map((x) => x.r || 0));
  const hayReal = fuentes.some((x) => x.r !== null);
  return {
    planeado, real, hayReal, mostrado: hayReal ? real : planeado,
    tasaPlan, tasaReal: cambiados > 0 ? pesosCambiados / cambiados : null,
    usdPorCambiar, diferenciaTasa: realUsdEnPesos - usdReal * t,
    faltaTasa: tasaPlan === null && (usdPlan > 0 || usdReal > 0),
    porPersona: (persona) => sumar(enPesos.filter((x) => x.f.persona === persona).map((x) => x.r || 0)) +
      (usdReal > 0 ? realUsdEnPesos * sumar(dolares.filter((x) => x.f.persona === persona).map((x) => x.r || 0)) / usdReal : 0),
  };
}

/** Personas que se muestran: las activas y las inactivas con algún valor distinto de 0. */
function personasVisibles(datos, valores) {
  return datos.config.personas.filter((p) => p.activa || valores(p.nombre).some((v) => v !== 0));
}

function filasDelMes(datos, i, fraccion) {
  const orden = new Map(datos.config.grupos.map((g) => [g.nombre, g.orden]));
  return gastosPropios(datos)
    .map((g, indice) => {
      const presupuesto = presupuestoEfectivo(datos, g, i);
      const real = numero(celda(g, i, 1));
      return {
        indice, tipo: g.tipo, grupo: orden.has(g.grupo) ? g.grupo : SIN_GRUPO, gasto: g.gasto,
        presupuesto, real, diferencia: presupuesto - (real || 0),
        avance: presupuesto > 0 ? (real || 0) / presupuesto : 0,
        estado: estadoDe(g.comportamiento, presupuesto, real, fraccion),
      };
    })
    .filter((f) => f.presupuesto > 0 || f.real !== null)
    .sort((a, b) => (orden.get(a.grupo) ?? Infinity) - (orden.get(b.grupo) ?? Infinity) || a.indice - b.indice);
}

/** Resumen del mes i (0 = mes de inicio) tal como lo muestra el Panel. */
function calcularMes(datos, i, hoy) {
  const ingresos = ingresosDelMes(datos, i);
  const filas = filasDelMes(datos, i, fraccionDelMes(datos, i, hoy));
  const presupuestado = sumar(filas.map((f) => f.presupuesto));
  const gastado = sumar(filas.map((f) => f.real || 0));
  const tipos = datos.config.tipos.map((t) => {
    const real = sumar(filas.filter((f) => f.tipo === t.letra).map((f) => f.real || 0));
    return { tipo: t.letra, nombre: t.nombre, real, pctIngreso: ingresos.mostrado ? real / ingresos.mostrado : 0, meta: t.meta };
  });
  const presupuestaDe = (persona) => sumar(gastosConPresupuesto(datos)
    .filter((g) => g.persona === persona).map((g) => presupuestoEfectivo(datos, g, i)));
  const personas = personasVisibles(datos, (p) => [ingresos.porPersona(p), presupuestaDe(p)]).map((p) => {
    const ingresa = ingresos.porPersona(p.nombre);
    const presupuesta = presupuestaDe(p.nombre);
    return { persona: p.nombre, ingresa, presupuesta, leQueda: ingresa - presupuesta };
  });
  const ano = Array.from({ length: CONFIG.MESES }, (_, k) => ({
    presupuestado: sumar(gastosPropios(datos).map((g) => presupuestoEfectivo(datos, g, k))),
    real: sumar(gastosPropios(datos).map((g) => numero(celda(g, k, 1)) || 0)),
  }));
  const { porPersona, ...resumenIngresos } = ingresos;
  return {
    ingresos: resumenIngresos, presupuestado, gastado, queda: presupuestado - gastado,
    sinAsignar: ingresos.planeado - presupuestado,
    filas: filas.map(({ indice, tipo, ...f }) => f), tipos, personas, ano,
  };
}

/** Recuadro de una forma de pago (Efectivo por defecto) para el mes i, por persona. */
function calcularFormaPago(datos, i, formaPago) {
  const conPresupuesto = gastosConPresupuesto(datos).filter((g) => g.pago === formaPago);
  const sinPartes = gastosPropios(datos).filter((g) => !esPadre(datos, g) && g.pago === formaPago);
  const presupuestadoDe = (p) => sumar(conPresupuesto.filter((g) => g.persona === p).map((g) => presupuestoEfectivo(datos, g, i)));
  const gastadoDe = (p) => sumar(sinPartes.filter((g) => g.persona === p).map((g) => numero(celda(g, i, 1)) || 0));
  const filas = personasVisibles(datos, (p) => [presupuestadoDe(p), gastadoDe(p)]).map((p) => {
    const presupuestado = presupuestadoDe(p.nombre);
    const gastado = gastadoDe(p.nombre);
    return { persona: p.nombre, presupuestado, gastado, falta: presupuestado - gastado };
  });
  const total = (k) => sumar(filas.map((f) => f[k]));
  return {
    filas,
    total: { presupuestado: total('presupuestado'), gastado: total('gastado'), falta: total('falta') },
    sinContar: datos.gastos.filter((g) => esPadre(datos, g) &&
      datos.gastos.some((o) => o.parteDe === g.gasto && o.pago === formaPago)).map((g) => g.gasto),
  };
}
