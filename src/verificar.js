/** Verificación de la planilla generada contra el oráculo, con los datos de ejemplo. Se ejecuta desde el editor. */

const MESES_VERIFICADOS = ['2026-01', '2026-02', '2026-03', '2026-04'];

function iguales(real, esperado) {
  if (typeof esperado === 'number') {
    return typeof real === 'number' && Math.abs(real - esperado) <= 1e-6 * Math.max(1, Math.abs(esperado));
  }
  return String(real) === String(esperado === null ? '' : esperado);
}

/** Compara Panel y oráculo para un mes; agrega a `diferencias` cada valor que no coincide. */
function compararPanel(ss, mes, diferencias) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.panel);
  ss.getRangeByName('PanelMes').setValue(mes);
  SpreadsheetApp.flush();
  const esperado = calcularPanel(EJEMPLO, mes, new Date());
  const anotar = (donde, real, esp) => {
    if (!iguales(real, esp)) diferencias.push(`${mes} ${donde}: planilla=${real} oráculo=${esp}`);
  };

  const kpis = { PanelIngresos: 'ingresos', PanelPresupuestado: 'presupuestado', PanelGastado: 'gastado',
    PanelDisponible: 'disponible', PanelSinAsignar: 'sinAsignar' };
  for (const [nombre, clave] of Object.entries(kpis)) anotar(nombre, ss.getRangeByName(nombre).getValue(), esperado[clave]);

  const inicio = ss.getRangeByName('PanelTabla');
  const filas = sh.getRange(inicio.getRow(), 1, FILAS_TABLA, 7).getValues().filter((f) => f[1] !== '');
  anotar('cantidad de filas', filas.length, esperado.filas.length);
  for (const e of esperado.filas) {
    const f = filas.find((x) => x[1] === e.categoria);
    if (!f) { diferencias.push(`${mes} falta la fila ${e.categoria}`); continue; }
    ['grupo', 'categoria', 'presupuesto', 'gastado', 'avance', 'estado', 'segunCompras']
      .forEach((clave, i) => anotar(`${e.categoria}.${clave}`, f[i], e[clave]));
  }

  const tipos = ss.getRangeByName('PanelTipos');
  const reales = sh.getRange(tipos.getRow(), tipos.getColumn(), esperado.tipos.length, 4).getValues();
  esperado.tipos.forEach((t, i) => {
    anotar(`tipo ${t.tipo}.gastado`, reales[i][1], t.gastado);
    anotar(`tipo ${t.tipo}.pctIngreso`, reales[i][2], t.pctIngreso);
    anotar(`tipo ${t.tipo}.meta`, reales[i][3], t.meta);
  });
}

/** Genera la planilla de ejemplo y compara el Panel con el oráculo mes a mes. */
function verificarPanel() {
  const inicio = Date.now();
  const ss = SpreadsheetApp.openByUrl(generarPlantilla({ nombre: `Verificación ${CONFIG.VERSION}`, conEjemplo: true }));
  const generada = Date.now();
  const diferencias = [];
  const ofrecidos = ss.getRangeByName('ListaMeses').getValues().flat().filter(String);
  ['2026-01', '2026-02', '2026-03'].filter((m) => !ofrecidos.includes(m))
    .forEach((m) => diferencias.push(`el selector no ofrece ${m}, que tiene datos`));
  // La validación rechaza meses sin datos; se quita mientras se verifica y se restaura al final.
  const selector = ss.getRangeByName('PanelMes');
  const validacion = selector.getDataValidation();
  selector.clearDataValidations();
  MESES_VERIFICADOS.forEach((mes) => compararPanel(ss, mes, diferencias));
  selector.setValue('Mes actual').setDataValidation(validacion);
  const resultado = { ok: diferencias.length === 0, diferencias };
  Logger.log([
    `URL: ${ss.getUrl()}`,
    `Generación: ${((generada - inicio) / 1000).toFixed(1)} s; verificación: ${((Date.now() - generada) / 1000).toFixed(1)} s`,
    `Meses verificados: ${MESES_VERIFICADOS.join(', ')}; el selector ofrece: ${ofrecidos.join(', ')}`,
    resultado.ok ? 'OK: el Panel coincide con el oráculo' : `Diferencias (${diferencias.length}):\n${diferencias.join('\n')}`,
  ].join('\n'));
  return resultado;
}
