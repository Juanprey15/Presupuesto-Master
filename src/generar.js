/**
 * Crea una planilla nueva de Presupuesto Master con todas sus pestañas y devuelve su URL.
 * @param {{nombre?: string, conEjemplo?: boolean}} [opciones]
 */
function generarPlantilla(opciones) {
  const { nombre = `Presupuesto Master ${CONFIG.VERSION}`, conEjemplo = false } = opciones || {};
  const datos = conEjemplo ? EJEMPLO : undefined;
  const ss = SpreadsheetApp.create(nombre);
  const porDefecto = ss.getSheets()[0];
  Object.values(CONFIG.HOJAS).forEach((titulo, i) => ss.insertSheet(titulo, i));
  ss.deleteSheet(porDefecto);
  construirConfiguracion(ss, datos);
  construirListas(ss);
  construirDatos(ss, datos);
  ss.getSheetByName(CONFIG.HOJAS.listas).hideSheet();
  return ss.getUrl();
}

/** Genera una planilla con los datos de ejemplo ficticios (para probar desde el editor). */
function generarConEjemplo() {
  const url = generarPlantilla({ nombre: `Presupuesto Master ${CONFIG.VERSION} (ejemplo)`, conEjemplo: true });
  Logger.log(url);
  return url;
}
