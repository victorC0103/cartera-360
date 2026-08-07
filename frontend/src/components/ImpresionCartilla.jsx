/**
 * ImpresionCartilla.jsx
 * Componente de impresión fiel al formato físico del almacén
 * "Créditos La Gloria de Dios". Diseñado para impresión A5/A4.
 *
 * Uso: renderizar con un ref y disparar desde react-to-print.
 * Este componente está oculto en pantalla (hidden) y visible solo al imprimir.
 */

import { forwardRef } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (val) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
    parseFloat(val) || 0
  );

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// Cantidad de filas vacías que aparecerán para que el cobrador anote a mano
const FILAS_VACIAS = 14;

// ─── Componente Principal ─────────────────────────────────────────────────────

const ImpresionCartilla = forwardRef(({ cartilla, abonos = [], mode = 'print' }, ref) => {
  if (!cartilla) return null;

  // Dividir los abonos en dos columnas (izquierda y derecha)
  // Aseguramos que los abonos estén en orden cronológico (el backend los manda DESC)
  const abonosChronological = [...abonos].reverse();
  const totalFilas     = Math.max(abonosChronological.length + FILAS_VACIAS, 20);
  const mitad          = Math.ceil(totalFilas / 2);
  const filasIzquierda = Array.from({ length: mitad });
  const filasDerecha   = Array.from({ length: totalFilas - mitad });

  const saldoInicial   = parseFloat(cartilla.total_con_intereses || cartilla.monto_a_financiar || 0);
  let   saldoActual    = saldoInicial;

  // Pre-calcular saldos por abono para la tabla
  const abonosConSaldo = abonosChronological.map((ab) => {
    saldoActual = Math.max(0, saldoActual - parseFloat(ab.monto_cobrado || 0));
    return { ...ab, saldo_tras_abono: saldoActual };
  });

  // Articulos para mostrar en el cuerpo
  const articulosTexto = cartilla.articulos_detalle || cartilla.articulo || '—';

  // ─── Estilos inline para garantía de impresión (Tailwind print: clases a veces no cargan en iframe) ───
  const cellStyle = {
    border: '1px solid #1e3a8a',
    padding: '2px 4px',
    fontSize: '9px',
    textAlign: 'center',
    minHeight: '16px',
    height: '16px',
  };
  const thStyle = {
    ...cellStyle,
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '8px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  };

  const renderFila = (idx, abonoIndex) => {
    const ab = abonoIndex < abonosChronological.length ? abonosConSaldo[abonoIndex] : null;
    return (
      <tr key={idx}>
        <td style={cellStyle}>{ab ? fmtDate(ab.fecha_registro) : ''}</td>
        <td style={{ ...cellStyle, color: ab ? '#065f46' : 'inherit', fontWeight: ab ? '600' : 'normal' }}>
          {ab ? fmtCurrency(ab.monto_cobrado) : ''}
        </td>
        <td style={{ ...cellStyle, color: ab ? '#991b1b' : 'inherit' }}>
          {ab ? fmtCurrency(ab.saldo_tras_abono) : ''}
        </td>
      </tr>
    );
  };

  return (
    /*
     * mode='print' → hidden en pantalla, visible solo al imprimir.
     * mode='preview' → siempre visible (usado en VisualizadorCartillaModal).
     */
    <div
      ref={ref}
      className={mode === 'preview' ? 'block' : 'hidden print:block'}
    >
      <div
        style={{
          width: '148mm',        /* A5 landscape ancho */
          minHeight: '105mm',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Arial', sans-serif",
          padding: '6mm 8mm',
          boxSizing: 'border-box',
        }}
      >

        {/* ── A. CABECERA ─────────────────────────────────────────── */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '6px', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px' }}>
          {/* Folio — esquina superior derecha */}
          <div style={{ position: 'absolute', top: 0, right: 0, textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: '#6b7280' }}>N° Cartilla</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc2626', letterSpacing: '1px' }}>
              {String(cartilla.id_venta || 0).padStart(7, '0')}
            </div>
          </div>

          <p style={{ fontSize: '14px', fontWeight: '900', color: '#1e3a8a', margin: 0, lineHeight: 1.2 }}>
            Créditos La Gloria de Dios
          </p>
          <p style={{ fontSize: '8px', color: '#374151', margin: '2px 0 0' }}>
            R.U.C.: 0920847027001
          </p>
          <p style={{ fontSize: '7.5px', color: '#4b5563', margin: '2px 60px 0', lineHeight: 1.3 }}>
            Venta al por menor de colchones, cubrecamas, artículos de plásticos
            y Artefactos electrodomésticos a pedido
          </p>
          <p style={{ fontSize: '7.5px', color: '#4b5563', margin: '2px 0 0' }}>
            Cdla. Las Piñas - Calles Armando Jiménez Principal ✦ Telf: 098 156 8545 - 095 977 8875
          </p>
        </div>

        {/* ── B. CUERPO — Datos del Crédito y Cliente ─────────────── */}
        <div style={{ fontSize: '9px', marginBottom: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px' }}>
          {/* Fila 1: Nombre */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '52px', fontWeight: 'bold' }}>Nombre:</span>
            <span style={{ fontWeight: '600' }}>{cartilla.nombres} {cartilla.apellidos}</span>
          </div>
          {/* Fila 2: Artículo */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '52px', fontWeight: 'bold' }}>Artículo:</span>
            <span>{articulosTexto}</span>
          </div>
          {/* Fila 3: Dirección / Zona */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '52px', fontWeight: 'bold' }}>Dirección:</span>
            <span>{cartilla.direccion_detallada || '—'}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '38px', fontWeight: 'bold' }}>Zona:</span>
            <span>{cartilla.nombre_sector || '—'}</span>
          </div>
          {/* Fila 4: Fecha / Vendido */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '52px', fontWeight: 'bold' }}>Fecha:</span>
            <span>{fmtDate(cartilla.fecha_venta)}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '38px', fontWeight: 'bold' }}>Vendido:</span>
            <span style={{ fontWeight: '700', color: '#1e3a8a' }}>CRÉDITO</span>
          </div>
          {/* Fila 5: Plazo / Garante */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '52px', fontWeight: 'bold' }}>Plazo:</span>
            <span>{cartilla.cantidad_cuotas || '—'} cuotas ({cartilla.frecuencia_pago || '—'})</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '38px', fontWeight: 'bold' }}>Garante:</span>
            <span style={{ borderBottom: '1px solid #94a3b8', flex: 1 }}>&nbsp;</span>
          </div>
          {/* Fila 6: Serie / Entrada / Cuota / Teléfono */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '52px', fontWeight: 'bold' }}>Entrada:</span>
            <span style={{ fontWeight: '700', color: '#065f46' }}>{fmtCurrency(cartilla.valor_entrada)}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '38px', fontWeight: 'bold' }}>Cuota:</span>
            <span style={{ fontWeight: '700', color: '#1e3a8a' }}>
              {fmtCurrency(cartilla.valor_cuota || (cartilla.total_con_intereses / cartilla.cantidad_cuotas))}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '52px', fontWeight: 'bold' }}>Total:</span>
            <span style={{ fontWeight: '700' }}>{fmtCurrency(cartilla.total_con_intereses)}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px dotted #94a3b8', paddingBottom: '1px' }}>
            <span style={{ color: '#6b7280', minWidth: '38px', fontWeight: 'bold' }}>Tel.:</span>
            <span>{cartilla.telefono_principal || '—'}</span>
          </div>
        </div>

        {/* ── C. TABLA DOBLE DE PAGOS ──────────────────────────────── */}
        <div style={{ fontSize: '8px', marginBottom: '2px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Control de Pagos
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '6px' }}>
          {/* Tabla Izquierda */}
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Abono</th>
                <th style={thStyle}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filasIzquierda.map((_, i) => renderFila(i, i))}
            </tbody>
          </table>
          {/* Tabla Derecha */}
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Abono</th>
                <th style={thStyle}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filasDerecha.map((_, i) => renderFila(i + mitad, i + mitad))}
            </tbody>
          </table>
        </div>

        {/* ── D. PIE — Firmas ───────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingTop: '8px', borderTop: '1px solid #1e3a8a', marginTop: '4px' }}>
          {['Recaudador', 'F. Supervisor', 'F. Vendedor'].map((label) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ width: '90px', borderTop: '1px solid #0f172a', marginBottom: '2px' }} />
              <div style={{ fontSize: '7.5px', color: '#374151' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Nota al pie ────────────────────────────────────────────── */}
        <p style={{ fontSize: '6.5px', color: '#9ca3af', textAlign: 'center', marginTop: '4px' }}>
          Documento generado electrónicamente por CrediRuta ERP · {new Date().toLocaleDateString('es-EC')}
        </p>
      </div>
    </div>
  );
});

ImpresionCartilla.displayName = 'ImpresionCartilla';

export default ImpresionCartilla;
