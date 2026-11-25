/**
 * Crea una planilla nueva de Presupuesto Master con todas sus pestañas y devuelve su URL.
 * @param {{nombre?: string, conEjemplo?: boolean, datos?: object}} [opciones] `datos` tiene prioridad sobre `conEjemplo`.
 */
function generarPlantilla(opciones) {
  const { nombre = `Presupuesto Master ${CONFIG.VERSION}`, conEjemplo = false } = opciones || {};
  const datos = (opciones && opciones.datos) || (conEjemplo ? EJEMPLO : undefined);
  const ss = SpreadsheetApp.create(nombre);
  // setFormula interpreta separadores según la configuración regional: se construye en en_US.
  ss.setSpreadsheetLocale('en_US');
  ss.setSpreadsheetTimeZone(CONFIG.ZONA_HORARIA);
  const porDefecto = ss.getSheets()[0];
  Object.values(CONFIG.HOJAS).forEach((titulo, i) => ss.insertSheet(titulo, i));
  ss.deleteSheet(porDefecto);
  construirConfiguracion(ss, datos);
  construirListas(ss);
  construirGastos(ss, datos);
  construirIngresos(ss, datos);
  construirPanel(ss, datos);
  construirInicio(ss);
  ss.getSheetByName(CONFIG.HOJAS.listas).hideSheet();
  ss.setSpreadsheetLocale(CONFIG.LOCALE);
  return ss.getUrl();
}

/** Genera una planilla con los datos de ejemplo ficticios (para probar desde el editor). */
function generarConEjemplo() {
  const url = generarPlantilla({ nombre: `Presupuesto Master ${CONFIG.VERSION} (ejemplo)`, conEjemplo: true });
  Logger.log(url);
  return url;
}

/** Datos de la familia: existen solo durante la migración (src/familia.js, fuera de git). */
function datosFamilia() {
  if (typeof FAMILIA === 'undefined') throw new Error('Falta src/familia.js: corré la migración (scripts/migracion/migrar.js).');
  return FAMILIA;
}

/** Genera la planilla de la familia con su historial migrado. */
function generarFamilia() {
  const datos = datosFamilia();
  const url = generarPlantilla({ nombre: `Presupuesto ${datos.config.general.nombre} ${datos.config.general.ano}`, datos });
  Logger.log(url);
  return url;
}
