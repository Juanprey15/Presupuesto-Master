/** Pestaña oculta _Listas: listas de carga calculadas desde Configuración (solo activos). */

function formulasListas() {
  const sep = CONFIG.SEPARADOR;
  const noVacios = (r) => `IFERROR(FILTER(${r}, ${r}<>""))`;
  return [
    {
      nombre: 'ListaSubcategorias',
      formula: `=IFERROR(SORT(FILTER(CfgSubcategoriasCategoria&"${sep}"&CfgSubcategoriasSubcategoria, ` +
        'CfgSubcategoriasActiva=TRUE, CfgSubcategoriasSubcategoria<>"", ' +
        'ISNUMBER(MATCH(CfgSubcategoriasCategoria, FILTER(CfgCategoriasCategoria, CfgCategoriasActiva=TRUE), 0)))))',
    },
    { nombre: 'ListaCategorias', formula: '=IFERROR(SORT(FILTER(CfgCategoriasCategoria, CfgCategoriasActiva=TRUE, CfgCategoriasCategoria<>"")))' },
    { nombre: 'ListaPersonas', formula: `=${noVacios('CfgPersonasValor')}` },
    { nombre: 'ListaPersonasHogar', formula: `={"Hogar"; ${noVacios('CfgPersonasValor')}}` },
    { nombre: 'ListaFormasPago', formula: `=${noVacios('CfgFormasPagoValor')}` },
    { nombre: 'ListaTiendas', formula: '=IFERROR(SORT(FILTER(CfgTiendasValor, CfgTiendasValor<>"")))' },
    { nombre: 'ListaTarjetas', formula: `=${noVacios('CfgTarjetasTarjeta')}` },
    { nombre: 'ListaMonedas', formula: `=${noVacios('CfgMonedasMoneda')}` },
    { nombre: 'MonedaPrincipal', formula: '=IFERROR(INDEX(FILTER(CfgMonedasMoneda, CfgMonedasPrincipal=TRUE), 1), "COP")', unaCelda: true },
    {
      nombre: 'ListaMeses',
      formula: '={"Mes actual"; IFERROR(SORT(UNIQUE(FILTER(ARRAYFORMULA(YEAR({MovFecha; IngFecha})&"-"&' +
        'RIGHT("0"&MONTH({MovFecha; IngFecha}), 2)), ISNUMBER({MovFecha; IngFecha}))), 1, FALSE))}',
      requiereDatos: true,
    },
  ];
}

/**
 * Escribe las fórmulas de _Listas (fila 1 nombre, fila 2 fórmula) y define un rango con nombre por lista.
 * Con `deDatos`, escribe solo las listas que leen pestañas de datos (se llama después de construirDatos).
 */
function construirListas(ss, deDatos = false) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.listas);
  formulasListas().forEach((l, i) => {
    if (Boolean(l.requiereDatos) !== deDatos) return;
    const columna = i + 1;
    sh.getRange(1, columna).setValue(l.nombre).setFontWeight('bold');
    sh.getRange(2, columna).setFormula(l.formula);
    ss.setNamedRange(l.nombre, sh.getRange(2, columna, l.unaCelda ? 1 : sh.getMaxRows() - 1, 1));
  });
}
