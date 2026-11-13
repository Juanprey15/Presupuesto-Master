/**
 * Datos de ejemplo ficticios (familia Ana, Luis y Sol, enero a marzo de 2026).
 * Cada caso cubre una regla del Panel o de Hormiga; los resultados esperados están en tests/oraculo.test.js.
 */
const EJEMPLO = (() => {
  const mov = (fecha, monto, subcategoria, otros = {}) => ({
    fecha, monto, moneda: 'COP', subcategoria, pago: otros.pago || 'Ana', formaPago: otros.formaPago || 'Digital',
    tienda: otros.tienda || '', paraQuien: otros.paraQuien || 'Hogar', nota: otros.nota || '', origen: otros.origen || 'manual',
  });
  const tresVeces = (mes, dias, monto, subcategoria, otros) => dias.map((d) => mov(`${mes}-${d}`, monto, subcategoria, otros));
  const MESES = ['2026-01', '2026-02', '2026-03'];

  const movimientos = [
    // Fijas
    mov('2026-01-02', 1500000, 'Arriendo › Arriendo'),
    mov('2026-02-02', 1500000, 'Arriendo › Arriendo'),
    mov('2026-03-02', 1600000, 'Arriendo › Arriendo'),
    mov('2026-01-05', 700000, 'Colegio Sol › Pensión', { paraQuien: 'Sol', pago: 'Luis' }),
    mov('2026-02-05', 300000, 'Colegio Sol › Pensión', { paraQuien: 'Sol', pago: 'Luis' }),
    ...MESES.flatMap((m) => [mov(`${m}-08`, 120000, 'Servicios › Luz'), mov(`${m}-09`, 80000, 'Servicios › Agua')]),
    mov('2026-01-03', 120000, 'Gimnasio › Mensualidad', { pago: 'Luis' }),
    mov('2026-02-15', 400000, 'Ahorro › Ahorro'),
    mov('2026-02-20', 250000, 'Pago Tarjeta Azul › Cuota'),
    // Variables
    mov('2026-01-10', 700000, 'Mercado › Mercado', { tienda: 'Supermercado Central' }),
    mov('2026-02-10', 600000, 'Mercado › Mercado', { tienda: 'Supermercado Central' }),
    mov('2026-02-11', 300000, 'Mercado › Carnes', { tienda: 'Supermercado Central' }),
    mov('2026-02-12', 150000, 'Mercado › Aseo', { tienda: 'Supermercado Central', formaPago: 'Efectivo' }),
    mov('2026-03-04', 500000, 'Mercado › Mercado', { tienda: 'Supermercado Central' }),
    mov('2026-02-14', 40000, 'Salidas › Cine', { pago: 'Luis' }),
    mov('2026-01-20', 90000, 'Salidas › Cine', { origen: 'migrado' }),
    // Hormiga marcada (Café todos los meses, un domicilio sobre el monto máximo)
    ...MESES.flatMap((m) => tresVeces(m, ['06', '13', '22'], 8000, 'Antojos › Café', { tienda: 'Café La Esquina', formaPago: 'Efectivo' })),
    mov('2026-03-25', 8000, 'Antojos › Café', { origen: 'migrado' }),
    mov('2026-02-18', 45000, 'Antojos › Domicilios', { pago: 'Luis' }),
    // Posible hormiga: Panadería cumple los 3 meses, Heladería solo 2
    ...MESES.flatMap((m) => tresVeces(m, ['07', '14', '21'], 5000, 'Mercado › Panadería', { tienda: 'Panadería El Trigo', formaPago: 'Efectivo' })),
    ...['2026-02', '2026-03'].flatMap((m) => tresVeces(m, ['09', '16', '23'], 10000, 'Salidas › Heladería', { tienda: 'Heladería Polo', pago: 'Luis', paraQuien: 'Sol' })),
    // Filas defectuosas
    mov('2026-02-26', 20000, 'Varios › Inexistente'),
    mov('2026-02-27', null, 'Antojos › Café'),
  ];

  return {
    config: {
      personas: ['Ana', 'Luis', 'Sol'],
      grupos: ['Casa', 'Comida', 'Sol', 'Diversión', 'Ahorro', 'Tarjetas'],
      categorias: [
        { grupo: 'Casa', categoria: 'Arriendo', tipo: 'E', comportamiento: 'fija', activa: true },
        { grupo: 'Casa', categoria: 'Servicios', tipo: 'E', comportamiento: 'fija', activa: true },
        { grupo: 'Comida', categoria: 'Mercado', tipo: 'E', comportamiento: 'variable', activa: true },
        { grupo: 'Comida', categoria: 'Antojos', tipo: 'N', comportamiento: 'variable', activa: true },
        { grupo: 'Sol', categoria: 'Colegio Sol', tipo: 'E', comportamiento: 'fija', activa: true },
        { grupo: 'Diversión', categoria: 'Salidas', tipo: 'N', comportamiento: 'variable', activa: true },
        { grupo: 'Diversión', categoria: 'Gimnasio', tipo: 'N', comportamiento: 'fija', activa: false },
        { grupo: 'Ahorro', categoria: 'Ahorro', tipo: 'A', comportamiento: 'fija', activa: true },
        { grupo: 'Tarjetas', categoria: 'Pago Tarjeta Azul', tipo: 'E', comportamiento: 'fija', activa: true },
      ],
      subcategorias: [
        ['Arriendo', 'Arriendo'], ['Servicios', 'Luz'], ['Servicios', 'Agua'],
        ['Mercado', 'Mercado'], ['Mercado', 'Carnes'], ['Mercado', 'Aseo'], ['Mercado', 'Panadería'],
        ['Antojos', 'Café', true], ['Antojos', 'Snacks y golosinas', true], ['Antojos', 'Domicilios', true],
        ['Colegio Sol', 'Pensión'], ['Salidas', 'Cine'], ['Salidas', 'Heladería'], ['Salidas', 'Regalos'],
        ['Gimnasio', 'Mensualidad'], ['Ahorro', 'Ahorro'], ['Pago Tarjeta Azul', 'Cuota'],
      ].map(([categoria, subcategoria, hormiga = false]) => ({ categoria, subcategoria, activa: true, hormiga })),
      formasPago: ['Efectivo', 'Digital'],
      tiendas: ['Supermercado Central', 'Café La Esquina', 'Panadería El Trigo', 'Heladería Polo', 'Tienda Tecno'],
      tarjetas: [{ tarjeta: 'Tarjeta Azul', categoriaPago: 'Pago Tarjeta Azul' }],
      monedas: [{ moneda: 'COP', principal: true }, { moneda: 'USD', principal: false }],
      metas: [{ tipo: 'E', pct: 0.5 }, { tipo: 'A', pct: 0.2 }, { tipo: 'I', pct: 0.1 }, { tipo: 'N', pct: 0.2 }],
      hormiga: { montoMaximo: 30000, comprasPorMes: 3, mesesSeguidos: 3 },
    },
    movimientos,
    ingresos: MESES.flatMap((m) => [
      { fecha: `${m}-01`, persona: 'Ana', fuente: 'Salario', monto: 1000, moneda: 'USD' },
      { fecha: `${m}-05`, persona: 'Luis', fuente: 'Salario', monto: 2000000, moneda: 'COP' },
    ]),
    presupuestoBase: [
      ['Arriendo', 1500000, '2026-01'], ['Arriendo', 1600000, '2026-03'], ['Servicios', 300000, '2026-01'],
      ['Mercado', 800000, '2026-01'], ['Antojos', 100000, '2026-01'], ['Colegio Sol', 700000, '2026-01'],
      ['Salidas', 200000, '2026-01'], ['Gimnasio', 120000, '2026-01'], ['Ahorro', 400000, '2026-01'],
      ['Pago Tarjeta Azul', 250000, '2026-01'],
    ].map(([categoria, monto, vigenteDesde]) => ({ categoria, monto, vigenteDesde })),
    ajustes: [{ mes: '2026-02', categoria: 'Mercado', monto: 1000000 }],
    tarjeta: [
      { fecha: '2026-02-10', monto: 900000, tarjeta: 'Tarjeta Azul', subcategoria: 'Salidas › Regalos', tienda: 'Tienda Tecno', cuotas: 3, nota: 'Audífonos' },
      { fecha: '2026-02-17', monto: 12000, tarjeta: 'Tarjeta Azul', subcategoria: 'Antojos › Snacks y golosinas', tienda: '', cuotas: 1, nota: '' },
    ],
    tasas: [{ mes: '2026-01', moneda: 'USD', tasa: 4000 }, { mes: '2026-02', moneda: 'USD', tasa: 4100 }, { mes: '2026-03', moneda: 'USD', tasa: 4200 }],
  };
})();
