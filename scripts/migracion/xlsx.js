/** Lector mínimo de .xlsx (zip + XML) sin dependencias: valores en caché y fórmulas de cada celda. */
const fs = require('node:fs');
const zlib = require('node:zlib');

/** Archivos del zip: nombre -> Buffer (métodos 0 y 8). */
function leerZip(buf) {
  let fin = buf.length - 22;
  while (fin >= 0 && buf.readUInt32LE(fin) !== 0x06054b50) fin--;
  if (fin < 0) throw new Error('No es un archivo .xlsx (zip) válido');
  const total = buf.readUInt16LE(fin + 10);
  let p = buf.readUInt32LE(fin + 16);
  const archivos = {};
  for (let k = 0; k < total; k++) {
    const metodo = buf.readUInt16LE(p + 10);
    const tamano = buf.readUInt32LE(p + 20);
    const largoNombre = buf.readUInt16LE(p + 28);
    const largoExtra = buf.readUInt16LE(p + 30);
    const largoComentario = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nombre = buf.toString('utf8', p + 46, p + 46 + largoNombre);
    const inicio = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const datos = buf.subarray(inicio, inicio + tamano);
    archivos[nombre] = metodo === 8 ? zlib.inflateRawSync(datos) : datos;
    p += 46 + largoNombre + largoExtra + largoComentario;
  }
  return archivos;
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const texto = (s) => s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, e) => {
  if (e[0] !== '#') return ENTIDADES[e] ?? m;
  return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
});
const textos = (xml) => [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => texto(m[1])).join('');

/** Hojas del libro: nombre (sin espacios al borde) -> { a1: { valor, formula } }, solo celdas con valor o fórmula. */
function leerXlsx(ruta) {
  const z = leerZip(fs.readFileSync(ruta));
  const leer = (n) => (z[n] ? z[n].toString('utf8') : '');
  const compartidas = [...leer('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textos(m[1]));
  const destinos = Object.fromEntries([...leer('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)]
    .map((m) => [m[0].match(/Id="([^"]+)"/)[1], m[0].match(/Target="([^"]+)"/)[1]]));
  const libro = {};
  for (const m of leer('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const nombre = texto(m[0].match(/name="([^"]*)"/)[1]).trim();
    const destino = destinos[m[0].match(/r:id="([^"]+)"/)[1]].replace(/^\/?(xl\/)?/, 'xl/');
    const celdas = {};
    for (const c of leer(destino).matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cuerpo = c[3] || '';
      const tipo = (c[2].match(/t="(\w+)"/) || [])[1];
      const f = cuerpo.match(/<f[^>]*>([\s\S]*?)<\/f>/);
      const v = cuerpo.match(/<v>([\s\S]*?)<\/v>/);
      let valor = v ? texto(v[1]) : '';
      if (tipo === 's') valor = compartidas[Number(valor)];
      else if (tipo === 'inlineStr') valor = textos(cuerpo);
      else if (!tipo || tipo === 'n') valor = valor === '' ? '' : Number(valor);
      const formula = f ? texto(f[1]) : '';
      if (valor !== '' || formula) celdas[c[1]] = { valor, formula };
    }
    libro[nombre] = celdas;
  }
  return libro;
}

module.exports = { leerXlsx };
