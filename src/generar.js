/**
 * Crea una planilla nueva de Presupuesto Master con todas sus pestañas y devuelve su URL.
 * @param {{nombre?: string, conEjemplo?: boolean}} [opciones]
 */
function generarPlantilla(opciones) {
  const { nombre = `Presupuesto Master ${CONFIG.VERSION}` } = opciones || {};
  const ss = SpreadsheetApp.create(nombre);
  const porDefecto = ss.getSheets()[0];
  Object.values(CONFIG.HOJAS).forEach((titulo, i) => ss.insertSheet(titulo, i));
  ss.deleteSheet(porDefecto);
  ss.getSheetByName(CONFIG.HOJAS.listas).hideSheet();
  return ss.getUrl();
}
