/**
 * Oráculo: cálculo independiente en JS de lo que deben mostrar el Panel y Hormiga.
 * Las fórmulas de la planilla se verifican contra estas funciones (verificar.js).
 * Fechas como texto 'AAAA-MM-DD' y meses como 'AAAA-MM'.
 */

const SIN_CATEGORIA = 'Sin categoría';
const TOLERANCIA_RITMO = 0.1;

function mesDeFecha(fecha) {
  return fecha.slice(0, 7);
}

/** Meses de diferencia entre dos meses 'AAAA-MM' (b - a). */
function mesesEntre(a, b) {
  const n = (m) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7));
  return n(b) - n(a);
}

function aMonedaPrincipal(datos, monto, moneda, mes) {
  const principal = datos.config.monedas.find((m) => m.principal).moneda;
  if (!moneda || moneda === principal) return monto;
  const fila = datos.tasas.find((t) => t.mes === mes && t.moneda === moneda);
  if (!fila) throw new Error(`Sin tasa para ${moneda} en ${mes}`);
  return monto * fila.tasa;
}

/** Ajuste del mes si existe; si no, el base con mayor 'vigente desde' <= mes; si no, 0. Nunca incluye cuotas. */
function presupuestoDe(datos, categoria, mes) {
  const ajuste = datos.ajustes.find((a) => a.categoria === categoria && a.mes === mes);
  if (ajuste) return ajuste.monto;
  const vigentes = datos.presupuestoBase
    .filter((p) => p.categoria === categoria && p.vigenteDesde <= mes)
    .sort((a, b) => (a.vigenteDesde < b.vigenteDesde ? 1 : -1));
  return vigentes.length ? vigentes[0].monto : 0;
}

/** Suma de cuotas de una tarjeta que caen en el mes: la cuota k (1..n) cae en el mes de compra + k. */
function cuotasDe(datos, tarjeta, mes) {
  return datos.tarjeta
    .filter((c) => c.tarjeta === tarjeta && c.monto != null)
    .reduce((suma, c) => {
      const k = mesesEntre(mesDeFecha(c.fecha), mes);
      return k >= 1 && k <= c.cuotas ? suma + c.monto / c.cuotas : suma;
    }, 0);
}

/** Fracción del mes transcurrida a la fecha 'hoy': 1 si el mes ya pasó, 0 si es futuro. */
function fraccionDelMes(mes, hoy) {
  const mesHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  if (mes < mesHoy) return 1;
  if (mes > mesHoy) return 0;
  return hoy.getDate() / new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
}

function estadoDe(comportamiento, presupuesto, gastado, gastadoRitmo, fraccion) {
  if (gastado > presupuesto) return 'excedido';
  if (comportamiento === 'fija') {
    if (gastado === 0) return 'pendiente';
    return gastado < presupuesto ? 'pago parcial' : 'pagado';
  }
  if (gastado > 0 && gastadoRitmo === 0) return 'pagado';
  return presupuesto > 0 && gastadoRitmo / presupuesto > fraccion + TOLERANCIA_RITMO ? 'va rápido' : 'en ritmo';
}

function calcularPanel(datos, mes, hoy) {
  const { categorias, subcategorias, tarjetas, metas } = datos.config;
  const categoriaDeSub = new Map(subcategorias.map((s) => [`${s.categoria}${CONFIG.SEPARADOR}${s.subcategoria}`, s.categoria]));
  const gastado = {};
  const ritmo = {};
  for (const m of datos.movimientos) {
    if (m.monto == null || mesDeFecha(m.fecha) !== mes) continue;
    const cat = categoriaDeSub.get(m.subcategoria) || SIN_CATEGORIA;
    const valor = aMonedaPrincipal(datos, m.monto, m.moneda, mes);
    gastado[cat] = (gastado[cat] || 0) + valor;
    if (m.origen !== 'migrado') ritmo[cat] = (ritmo[cat] || 0) + valor;
  }

  const fraccion = fraccionDelMes(mes, hoy);
  const filas = categorias
    .filter((c) => c.activa || gastado[c.categoria])
    .map((c) => {
      const presupuesto = presupuestoDe(datos, c.categoria, mes);
      const g = gastado[c.categoria] || 0;
      const tarjeta = tarjetas.find((t) => t.categoriaPago === c.categoria);
      return {
        grupo: c.grupo, categoria: c.categoria, tipo: c.tipo, presupuesto, gastado: g,
        avance: presupuesto > 0 ? g / presupuesto : 0,
        estado: estadoDe(c.comportamiento, presupuesto, g, ritmo[c.categoria] || 0, fraccion),
        segunCompras: tarjeta ? cuotasDe(datos, tarjeta.tarjeta, mes) : null,
      };
    });
  if (gastado[SIN_CATEGORIA]) {
    const g = gastado[SIN_CATEGORIA];
    filas.push({ grupo: '', categoria: SIN_CATEGORIA, tipo: '', presupuesto: 0, gastado: g, avance: 0,
      estado: estadoDe('variable', 0, g, ritmo[SIN_CATEGORIA] || 0, fraccion), segunCompras: null });
  }

  const suma = (lista, clave) => lista.reduce((s, x) => s + x[clave], 0);
  const ingresos = datos.ingresos
    .filter((i) => i.monto != null && mesDeFecha(i.fecha) === mes)
    .reduce((s, i) => s + aMonedaPrincipal(datos, i.monto, i.moneda, mes), 0);
  const presupuestado = suma(filas, 'presupuesto');
  const totalGastado = suma(filas, 'gastado');
  const tipos = metas.map(({ tipo, pct }) => {
    const g = suma(filas.filter((f) => f.tipo === tipo), 'gastado');
    return { tipo, gastado: g, pctIngreso: ingresos ? g / ingresos : 0, meta: pct };
  });
  return {
    ingresos, presupuestado, gastado: totalGastado, disponible: ingresos - totalGastado,
    sinAsignar: ingresos - presupuestado, filas, tipos,
  };
}
