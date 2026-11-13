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
  ];
}

/** Escribe las fórmulas de _Listas (fila 1 nombre, fila 2 fórmula) y define un rango con nombre por lista. */
function construirListas(ss) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.listas);
  formulasListas().forEach((l, i) => {
    const columna = i + 1;
    sh.getRange(1, columna).setValue(l.nombre).setFontWeight('bold');
    sh.getRange(2, columna).setFormula(l.formula);
    ss.setNamedRange(l.nombre, sh.getRange(2, columna, l.unaCelda ? 1 : sh.getMaxRows() - 1, 1));
  });
}
