/**
 * Migración de la copia familiar a la hoja anual.
 *   node scripts/migracion/migrar.js borrador <xlsx> <equivalencias.json> [año]
 *   node scripts/migracion/migrar.js convertir <xlsx> <equivalencias.json> <salida.js>
 * `convertir` compara los totales de cada mes con la hoja vieja y no escribe nada si alguno difiere.
 */
const fs = require('node:fs');
const { leerXlsx } = require('./xlsx');
const { extraerMes, MESES_VIEJOS } = require('./extraer');
const { convertir, compararTotales, borrador } = require('./convertir');

function leerMeses(ruta) {
  const libro = leerXlsx(ruta);
  return MESES_VIEJOS.filter((m) => libro[m]).map((m) => extraerMes(libro[m]));
}

function principal([accion, xlsx, tabla, extra]) {
  if (!['borrador', 'convertir'].includes(accion) || !xlsx || !tabla) {
    console.error('Uso: migrar.js borrador <xlsx> <equivalencias.json> [año] | convertir <xlsx> <equivalencias.json> <salida.js>');
    return 2;
  }
  const meses = leerMeses(xlsx);
  if (accion === 'borrador') {
    fs.writeFileSync(tabla, `${JSON.stringify(borrador(meses, Number(extra) || new Date().getFullYear()), null, 2)}\n`);
    console.log(`Borrador de equivalencias en ${tabla} (${meses.length} meses leídos).`);
    return 0;
  }
  if (!extra) { console.error('Falta el archivo de salida.'); return 2; }
  const datos = convertir(meses, JSON.parse(fs.readFileSync(tabla, 'utf8')));
  const diferencias = compararTotales(meses, datos);
  console.log(`Meses: ${meses.length}. Filas de gastos: ${datos.gastos.length}. Fuentes de ingreso: ${datos.ingresos.length}.`);
  if (diferencias.length) {
    for (const d of diferencias) console.log(`  ${d.mes} ${d.campo}: hoja vieja ${d.viejo}, convertido ${d.nuevo}`);
    console.error(`${diferencias.length} totales no coinciden; no se escribió ${extra}.`);
    return 1;
  }
  fs.writeFileSync(extra, `/** Datos de la familia para generarFamilia. Contiene datos reales: no se versiona. */\nconst FAMILIA = ${JSON.stringify(datos)};\n`);
  console.log(`Totales de presupuesto, pagado e ingreso iguales a la hoja vieja en los ${meses.length} meses. Escrito ${extra}.`);
  return 0;
}

process.exitCode = principal(process.argv.slice(2));
