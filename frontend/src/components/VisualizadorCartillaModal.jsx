/**
 * VisualizadorCartillaModal.jsx
 * Sala de "Vista Previa" antes de imprimir la cartilla física.
 *
 * Muestra la cartilla a escala real en un contenedor que simula
 * la hoja de papel física (A5 landscape). El botón "Imprimir
 * Documento" dispara react-to-print sin generar ningún archivo
 * temporal en el disco duro del usuario.
 *
 * Props:
 *   isOpen       {boolean}   - Controla visibilidad del modal
 *   onClose      {function}  - Callback para cerrar el modal
 *   cartilla     {object}    - Datos del crédito / cliente
 *   abonos       {array}     - Historial de pagos de la cartilla
 */

import { useRef, useState } from 'react';
import { X, Printer, FileText, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import ImpresionCartilla from './ImpresionCartilla';

export default function VisualizadorCartillaModal({ isOpen, onClose, cartilla, abonos = [] }) {
  // Ref apuntando a la versión oculta optimizada para impresión
  const printRef = useRef(null);
  
  // Estado para el nivel de zoom
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const handleZoomReset = () => setZoom(1);

  // Hook react-to-print: abre el diálogo del S.O. sin descargar archivo
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Cartilla-${cartilla?.id_venta || ''}-${cartilla?.nombres || 'cliente'}`,
    pageStyle: `
      @page {
        size: A5 landscape;
        margin: 6mm 8mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  if (!isOpen || !cartilla) return null;

  const folioNum = String(cartilla.id_venta || 0).padStart(7, '0');

  return (
    <>
      {/*
        ── Target de impresión oculto (react-to-print lo captura).
        ── Modo 'print' = hidden en pantalla / visible solo al imprimir.
      */}
      <ImpresionCartilla
        ref={printRef}
        cartilla={cartilla}
        abonos={abonos}
        mode="print"
      />

      {/* ── Overlay ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-[60] bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4">

        {/* ── Contenedor Principal ─────────────────────────────── */}
        <div className="max-w-4xl w-full h-[90vh] flex flex-col bg-slate-100 rounded-xl overflow-hidden shadow-2xl border border-gray-200">

          {/* ── BARRA DE HERRAMIENTAS ──────────────────────────── */}
          <div className="shrink-0 bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between gap-4">
            {/* Izquierda: info del documento */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  Vista Previa de Impresión
                </h2>
                <p className="text-xs text-gray-400 truncate">
                  {cartilla.nombres} {cartilla.apellidos}
                  <span className="ml-2 font-mono text-gray-300">· Folio {folioNum}</span>
                </p>
              </div>
            </div>

            {/* Derecha: acciones */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Controles de Zoom */}
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1 mr-2 border border-gray-200">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-gray-500 hover:bg-white hover:text-gray-900 rounded-md transition-colors cursor-pointer"
                  title="Alejar"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 text-[10px] font-semibold text-gray-600 hover:bg-white rounded-md transition-colors h-[26px] cursor-pointer min-w-[50px] text-center"
                  title="Restablecer"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-gray-500 hover:bg-white hover:text-gray-900 rounded-md transition-colors cursor-pointer"
                  title="Acercar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              

              {/* Botón Cancelar */}
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>

              {/* Botón Imprimir — principal */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Documento
              </button>
            </div>
          </div>

          {/* ── ÁREA DE VISUALIZACIÓN (escritorio gris) ─────────── */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-300/70
            [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Contenedor del zoom */}
            <div className="transition-transform duration-200 origin-top" style={{ transform: `scale(${zoom})`, marginBottom: `${Math.max(0, (zoom - 1) * 560)}px` }}>
              {/* Hoja de papel simulada */}
              <div className="bg-white shadow-xl border border-gray-300 rounded-sm w-[760px] min-h-[560px] overflow-hidden">

              {/*
                ── ImpresionCartilla en mode='preview':
                ── visible en pantalla, sin clase 'hidden'.
                ── Sin ref (solo la versión oculta usa ref para imprimir).
              */}
              <ImpresionCartilla
                cartilla={cartilla}
                abonos={abonos}
                mode="preview"
              />

              </div>
            </div>
          </div>

          {/* ── FOOTER DEL VISUALIZADOR ─────────────────────────── */}
          <div className="shrink-0 bg-white border-t border-gray-200 px-5 py-2.5 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              La vista previa es una representación fiel del documento impreso.
              Ningún archivo es guardado en el disco.
            </p>
            <p className="text-[10px] text-gray-400 font-mono">
              {abonos.length} abono{abonos.length !== 1 ? 's' : ''} registrado{abonos.length !== 1 ? 's' : ''}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
