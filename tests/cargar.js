const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = path.join(__dirname, '..', 'src');

/** Ejecuta archivos de src/ (scripts globales de Apps Script) en un contexto compartido y lo devuelve. */
function cargar(...archivos) {
  const contexto = vm.createContext({});
  for (const archivo of archivos) {
    const ruta = path.join(SRC, archivo);
    vm.runInContext(fs.readFileSync(ruta, 'utf8'), contexto, { filename: ruta });
  }
  return contexto;
}

module.exports = { cargar };
