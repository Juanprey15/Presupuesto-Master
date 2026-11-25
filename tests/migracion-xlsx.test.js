const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { leerXlsx } = require('../scripts/migracion/xlsx');
const { extraerMes } = require('../scripts/migracion/extraer');

/** Zip sin compresión (método 0) con los archivos dados; suficiente para probar el lector. */
function zipSinComprimir(archivos) {
  const locales = [];
  const centrales = [];
  let offset = 0;
  for (const [nombre, texto] of Object.entries(archivos)) {
    const n = Buffer.from(nombre);
    const datos = Buffer.from(texto);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt32LE(datos.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt32LE(datos.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(offset, 42);
    locales.push(local, n, datos);
    centrales.push(central, n);
    offset += 30 + n.length + datos.length;
  }
  const dir = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(Object.keys(archivos).length, 10);
  fin.writeUInt32LE(dir.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, dir, fin]);
}

test('leerXlsx resuelve cadenas compartidas, números y fórmulas con su valor en caché', () => {
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const zip = zipSinComprimir({
    'xl/workbook.xml': `<workbook ${ns}><sheets><sheet name="Ene " sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml': `<sst ${ns}><si><t>Arriendo &amp; más</t></si></sst>`,
    'xl/worksheets/sheet1.xml': `<worksheet ${ns}><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>1500</v></c>` +
      '<c r="C1"><f>100*B1</f><v>150000</v></c><c r="D1" s="2"/></row></sheetData></worksheet>',
  });
  const ruta = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-')), 'prueba.xlsx');
  fs.writeFileSync(ruta, zip);
  assert.deepEqual(leerXlsx(ruta), {
    Ene: { A1: { valor: 'Arriendo & más', formula: '' }, B1: { valor: 1500, formula: '' }, C1: { valor: 150000, formula: '100*B1' } },
  });
});

/** Celdas ficticias con la disposición de la hoja vieja. */
function celdasMes() {
  const c = {};
  const poner = (a1, valor, formula = '') => { c[a1] = { valor, formula }; };
  poner('B4', 'USD'); poner('C4', 4000);
  poner('G4', 'Descripción');
  poner('G5', 'CASA');
  poner('G6', 'Arriendo'); poner('H6', 'Ana'); poner('I6', 'E'); poner('J6', 'Digital'); poner('K6', 900000); poner('L6', 900000);
  poner('G7', 'Mercado Efectivo'); poner('H7', 'Luis'); poner('I7', 'E'); poner('J7', 'Efectivo'); poner('K7', 300000);
  poner('G8', 'Total Gastos'); poner('K8', 1200000, 'SUM(x)'); poner('L8', 900000, 'SUM(x)');
  poner('N2', 'Mercado'); poner('N4', 'Tienda');
  poner('N5', 'Frutas'); poner('P5', ' Efectivo'); poner('Q5', 200000);
  poner('N6', 'Huevos'); poner('P6', 'Efectivo');
  poner('N7', 'Restante de lo presupuestado');
  poner('B30', 'F01'); poner('C30', 'Luis'); poner('D30', 'Sueldo '); poner('E30', 400000, '100*C4');
  poner('B31', 'F02'); poner('C31', 'Ana'); poner('D31', 'Ventas'); poner('E31', 50000);
  poner('B32', 'Total'); poner('E32', 450000, 'SUM(Ingresos)');
  return c;
}

test('extraerMes lee tasa, renglones con su grupo, desgloses, ingresos y totales', () => {
  assert.deepEqual(extraerMes(celdasMes()), {
    tasa: 4000,
    renglones: [
      { grupo: 'CASA', desc: 'Arriendo', persona: 'Ana', tipo: 'E', pago: 'Digital', presupuesto: 900000, pagado: 900000 },
      { grupo: 'CASA', desc: 'Mercado Efectivo', persona: 'Luis', tipo: 'E', pago: 'Efectivo', presupuesto: 300000, pagado: null },
    ],
    desgloses: { Mercado: [{ item: 'Frutas', pago: 'Efectivo', valor: 200000 }, { item: 'Huevos', pago: 'Efectivo', valor: 0 }] },
    ingresos: [
      { persona: 'Luis', fuente: 'Sueldo', valor: 400000, dolares: 100 },
      { persona: 'Ana', fuente: 'Ventas', valor: 50000, dolares: null },
    ],
    totales: { presupuesto: 1200000, pagado: 900000, ingreso: 450000 },
  });
});

test('extraerMes rechaza una pestaña sin la tabla de gastos', () => {
  assert.throws(() => extraerMes({ G5: { valor: 'Descripción', formula: '' } }), /Total Gastos/);
  assert.throws(() => extraerMes({ G9: { valor: 'Total Gastos', formula: '' } }), /Descripción/);
});
