/** Verificación de la planilla generada contra el oráculo, con los datos de ejemplo. Se ejecuta desde el editor. */

const MESES_VERIFICADOS = [0, 1, 2, 3];
const FORMAS_VERIFICADAS = ['Efectivo', 'Digital'];

function iguales(real, esperado) {
  if (typeof esperado === 'number') {
    return typeof real === 'number' && Math.abs(real - esperado) <= 1e-6 * Math.max(1, Math.abs(esperado));
  }
  return String(real) === String(esperado === null ? '' : esperado);
}

/** Filas de un rango con nombre que no están vacías en su primera columna. */
function filasDe(ss, nombre) {
  return ss.getRangeByName(nombre).getValues().filter((f) => f[0] !== '');
}

/** Compara una matriz leída de la planilla con la esperada, celda por celda. */
function compararFilas(donde, reales, esperadas, anotar) {
  anotar(`${donde}: cantidad de filas`, reales.length, esperadas.length);
  esperadas.forEach((fila, k) => fila.forEach((v, j) => anotar(`${donde}[${k}][${j}]`, reales[k] ? reales[k][j] : '', v)));
}

/** Compara el Panel con el oráculo para el mes i; agrega a `diferencias` cada valor que no coincide. */
function compararMes(ss, i, hoy, diferencias) {
  const { ano, mesInicio, segundaMoneda } = EJEMPLO.config.general;
  ss.getRangeByName('PanelMes').setValue(new Date(ano, mesInicio - 1 + i, 1));
  SpreadsheetApp.flush();
  const m = calcularMes(EJEMPLO, i, hoy);
  const anotar = (donde, real, esp) => {
    if (!iguales(real, esp)) diferencias.push(`mes ${i} ${donde}: planilla=${real} oráculo=${esp}`);
  };
  const valor = (nombre) => ss.getRangeByName(nombre).getValue();

  anotar('PanelIngresos', valor('PanelIngresos'), m.ingresos.mostrado);
  anotar('PanelIngresosEtiqueta', valor('PanelIngresosEtiqueta'), m.ingresos.hayReal ? 'Ingresos' : 'Ingresos (planeados)');
  anotar('PanelPresupuestado', valor('PanelPresupuestado'), m.presupuestado);
  anotar('PanelGastado', valor('PanelGastado'), m.gastado);
  anotar('PanelQueda', valor('PanelQueda'), m.queda);
  anotar('PanelSinAsignar', valor('PanelSinAsignar'), m.sinAsignar);

  compararFilas('PanelTabla', filasDe(ss, 'PanelTabla'),
    m.filas.map((f) => [f.grupo, f.gasto, f.presupuesto, f.real, f.diferencia, f.avance, f.estado]), anotar);
  compararFilas('PanelTasa', ss.getRangeByName('PanelTasa').getValues(), [
    ['Tasa para planear', m.ingresos.tasaPlan === null ? 'falta' : m.ingresos.tasaPlan],
    ['Tasa real', m.ingresos.tasaReal === null ? 'pendiente' : m.ingresos.tasaReal]], anotar);
  compararFilas('PanelIngresosMes', ss.getRangeByName('PanelIngresosMes').getValues(), [
    ['Planeado', m.ingresos.planeado], ['Llegó', m.ingresos.hayReal ? m.ingresos.real : ''],
    ['Diferencia por la tasa', m.ingresos.diferenciaTasa]], anotar);
  const porCambiar = Math.round(m.ingresos.usdPorCambiar).toLocaleString('es-CO');
  anotar('PanelAvisoTasa', valor('PanelAvisoTasa'), m.ingresos.faltaTasa ? 'Falta la tasa para planear'
    : m.ingresos.usdPorCambiar > 0 ? `Faltan ${segundaMoneda} ${porCambiar} por cambiar` : '');
  compararFilas('PanelTipos', filasDe(ss, 'PanelTipos'),
    m.tipos.map((t) => [t.tipo, t.nombre, t.real, t.pctIngreso, t.meta]), anotar);
  compararFilas('PanelPersonas', filasDe(ss, 'PanelPersonas'),
    m.personas.map((p) => [p.persona, p.ingresa, p.presupuesta, p.leQueda]), anotar);
  compararFilas('PanelAno', ss.getRangeByName('PanelAno').getValues().map((f) => [f[1], f[2]]),
    m.ano.map((a) => [a.presupuestado, a.real]), anotar);

  for (const forma of FORMAS_VERIFICADAS) {
    ss.getRangeByName('PanelFormaPago').setValue(forma);
    SpreadsheetApp.flush();
    const e = calcularFormaPago(EJEMPLO, i, forma);
    compararFilas(`PanelFormaPagoTabla ${forma}`, filasDe(ss, 'PanelFormaPagoTabla'), [
      ...e.filas.map((f) => [f.persona, f.presupuestado, f.gastado, f.falta]),
      ['Total', e.total.presupuestado, e.total.gastado, e.total.falta]], anotar);
    anotar(`PanelFormaPagoNota ${forma}`, valor('PanelFormaPagoNota'),
      e.sinContar.length ? `Gastado sin contar: ${e.sinContar.join(', ')}` : '');
  }
}

/** Genera la planilla de ejemplo y compara el Panel con el oráculo mes a mes. */
function verificarPanel() {
  const inicio = Date.now();
  const ss = SpreadsheetApp.openByUrl(generarPlantilla({ nombre: `Verificación ${CONFIG.VERSION}`, conEjemplo: true }));
  const generada = Date.now();
  const diferencias = [];
  const hoy = new Date();
  // Las validaciones de los selectores se quitan mientras se verifica y se restauran al final.
  const selectores = ['PanelMes', 'PanelFormaPago'].map((n) => ss.getRangeByName(n));
  const validaciones = selectores.map((r) => r.getDataValidation());
  const valores = selectores.map((r) => r.getValue());
  selectores.forEach((r) => r.clearDataValidations());
  MESES_VERIFICADOS.forEach((i) => compararMes(ss, i, hoy, diferencias));
  selectores.forEach((r, k) => r.setValue(valores[k]).setDataValidation(validaciones[k]));
  const resultado = { ok: diferencias.length === 0, diferencias };
  Logger.log([
    `URL: ${ss.getUrl()}`,
    `Generación: ${((generada - inicio) / 1000).toFixed(1)} s; verificación: ${((Date.now() - generada) / 1000).toFixed(1)} s`,
    `Meses verificados: ${MESES_VERIFICADOS.join(', ')}; formas de pago: ${FORMAS_VERIFICADAS.join(', ')}`,
    resultado.ok ? 'OK: el Panel coincide con el oráculo' : `Diferencias (${diferencias.length}):\n${diferencias.join('\n')}`,
  ].join('\n'));
  return resultado;
}
