/** Pestaña Inicio: nombre del presupuesto, versión y las tres reglas de uso. */

function disenoInicio() {
  return [
    { a1: 'B2', formula: '=CfgNombre' },
    { a1: 'B3', valor: `Versión ${CONFIG.VERSION}` },
    { a1: 'B5', valor: 'Escribe lo real en Gastos' },
    { a1: 'B6', valor: 'Un gasto nuevo va en una fila libre' },
    { a1: 'B7', valor: 'El mes se elige en el Panel' },
  ];
}

function construirInicio(ss) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.inicio);
  const P = CONFIG.PALETA;
  for (const t of disenoInicio()) {
    const r = sh.getRange(t.a1);
    if (t.formula) r.setFormula(t.formula); else r.setValue(t.valor);
  }
  sh.getRange('A1:H10').setFontFamily('Bricolage Grotesque').setFontColor(P.ink).setFontSize(11);
  sh.getRange('B2').setFontSize(24).setFontWeight('bold');
  sh.getRange('B3').setFontColor(P.muted);
  sh.setColumnWidth(1, 24);
  sh.setColumnWidth(2, 420);
  sh.setHiddenGridlines(true);
}
