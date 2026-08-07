/**
 * NotificacionMoraModal.jsx
 * Módulo de Gestión de Cobranza Activa — Notificación por WhatsApp.
 *
 * Permite al cobrador/secretaria:
 *   1. Elegir un tono de mensaje (Amistoso / Firme / Pre-Judicial).
 *   2. Previsualizar el texto interpolado con los datos del cliente.
 *   3. Descargar la cartilla como imagen PNG (html2canvas).
 *   4. Abrir WhatsApp Web con el mensaje pre-escrito.
 *
 * Props:
 *   isOpen          {boolean}   — Controla visibilidad.
 *   onClose         {function}  — Callback para cerrar el modal.
 *   cartilla        {object}    — Datos del crédito / cliente.
 *   abonos          {array}     — Historial de pagos (para capturar la cartilla).
 *   valorVencido    {number}    — Monto exigible calculado por calcularMontoExigible.
 */

import { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Download, Send, AlertTriangle, Image, Phone, Clock, FileWarning, ShieldAlert, Heart } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import toast, { Toaster } from 'react-hot-toast';
import ImpresionCartilla from './ImpresionCartilla';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(val) || 0
  );

/**
 * Calcula el tiempo de atraso dinámicamente dividiendo el valor vencido
 * entre el valor de la cuota y evaluando la frecuencia de pago.
 */
function calcularTiempoAtraso(valorVencido, valorCuota, frecuenciaPago) {
  if (!valorVencido || !valorCuota || valorVencido <= 0 || valorCuota <= 0) {
    return { texto: 'Sin atraso' };
  }

  // Agregamos una tolerancia muy pequeña (0.05) para mitigar errores de redondeo por centavos
  const periodosCaidos = Math.floor((valorVencido / valorCuota) + 0.05);

  if (periodosCaidos < 1) {
    return { texto: 'Atraso por centavos' };
  }

  const freq = (frecuenciaPago || '').toLowerCase();
  let texto = '';

  if (freq === 'quincenal') {
    if (periodosCaidos === 1) texto = '1 Quincena';
    else if (periodosCaidos === 2) texto = '1 Mes';
    else if (periodosCaidos === 3) texto = '1 Mes y 1 Quincena';
    else if (periodosCaidos % 2 === 0) texto = `${periodosCaidos / 2} Meses`;
    else texto = `${Math.floor(periodosCaidos / 2)} Meses y 1 Quincena`;
  } 
  else if (freq === 'semanal') {
    if (periodosCaidos === 1) texto = '1 Semana';
    else if (periodosCaidos === 2) texto = '2 Semanas';
    else if (periodosCaidos === 3) texto = '3 Semanas';
    else if (periodosCaidos === 4) texto = '1 Mes';
    else if (periodosCaidos % 4 === 0) texto = `${periodosCaidos / 4} Meses`;
    else {
      const meses = Math.floor(periodosCaidos / 4);
      const semanas = periodosCaidos % 4;
      texto = `${meses} Mes${meses > 1 ? 'es' : ''} y ${semanas} Semana${semanas > 1 ? 's' : ''}`;
    }
  } 
  else if (freq === 'mensual') {
    texto = periodosCaidos === 1 ? '1 Mes' : `${periodosCaidos} Meses`;
  } 
  else if (freq === 'diario') {
    if (periodosCaidos === 1) texto = '1 Día';
    else if (periodosCaidos === 7) texto = '1 Semana';
    else if (periodosCaidos === 15) texto = '1 Quincena';
    else if (periodosCaidos >= 30) {
      const meses = Math.floor(periodosCaidos / 30);
      texto = meses === 1 ? '1 Mes' : `${meses} Meses`;
    } else {
      texto = `${periodosCaidos} Días`;
    }
  } 
  else {
    texto = `${periodosCaidos} Periodo${periodosCaidos > 1 ? 's' : ''}`;
  }

  return { texto };
}

// ─── Plantillas de Mensaje ────────────────────────────────────────────────────

function generarPlantilla(tipo, nombre, valorVencido, tiempoAtraso) {
  const saludo = `Hola estimado/a *${nombre}*`;
  const firma = `\n\n📍 *Créditos La Gloria de Dios*\nCdla. Las Piñas, Milagro\nTelf: 098 156 8545`;

  switch (tipo) {
    case 'amistoso':
      return (
        `${saludo}, le saludamos cordialmente de Créditos La Gloria de Dios. 😊\n\n` +
        `Le escribimos para recordarle amablemente que su cuenta presenta un pequeño atraso de *${tiempoAtraso}*.\n\n` +
        `El valor para ponerse al día es de *${fmtCurrency(valorVencido)}*.\n\n` +
        `Le adjuntamos su cartilla actualizada para su revisión. Puede acercarse a nuestras oficinas o coordinar el pago con su cobrador de confianza.\n\n` +
        `¡Agradecemos su preferencia y le deseamos un excelente día! 🙏` +
        firma
      );

    case 'firme':
      return (
        `${saludo}, le saludamos de *Créditos La Gloria de Dios*.\n\n` +
        `⚠️ Le informamos que su cuenta registra un *atraso de ${tiempoAtraso}*.\n\n` +
        `El monto vencido exigible es de *${fmtCurrency(valorVencido)}* y debe ser cancelado a la brevedad posible para evitar recargos adicionales.\n\n` +
        `Le adjuntamos su estado de cuenta actualizado. Por favor, comuníquese con nosotros para coordinar su pago inmediatamente.\n\n` +
        `_Este es un aviso formal de vencimiento de obligación crediticia._` +
        firma
      );

    case 'prejudicial':
      return (
        `${saludo}, nos dirigimos a usted de parte de *Créditos La Gloria de Dios*.\n\n` +
        `🔴 *NOTIFICACIÓN IMPORTANTE*\n\n` +
        `Su cuenta acumula un atraso significativo de *${tiempoAtraso}* con un saldo vencido de *${fmtCurrency(valorVencido)}*.\n\n` +
        `Hemos intentado contactarle en múltiples ocasiones sin obtener respuesta satisfactoria. De no regularizar su situación dentro de las próximas *48 horas*, nos veremos en la obligación de iniciar las gestiones de cobro correspondientes por la vía legal.\n\n` +
        `Le instamos encarecidamente a comunicarse con nuestras oficinas para llegar a un acuerdo de pago.\n\n` +
        `_Notificación pre-judicial emitida por el departamento de cartera._` +
        firma
      );

    default:
      return '';
  }
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function NotificacionMoraModal({ isOpen, onClose, cartilla, abonos = [], valorVencido = 0 }) {
  const [tono, setTono] = useState('amistoso');
  const [mensaje, setMensaje] = useState('');
  const [generandoImagen, setGenerandoImagen] = useState(false);
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);
  const cartillaRenderRef = useRef(null);

  // Datos derivados
  const nombreCliente = cartilla ? `${cartilla.nombres || ''} ${cartilla.apellidos || ''}`.trim() : '';
  const montoOriginal = parseFloat(cartilla?.total_con_intereses || cartilla?.monto_a_financiar || 0);
  const saldoPendiente = parseFloat(cartilla?.saldo_pendiente || 0);
  const totalPagado = Math.max(0, montoOriginal - saldoPendiente);
  const valorCuota = parseFloat(cartilla?.valor_cuota || 0);

  const atraso = cartilla
    ? calcularTiempoAtraso(valorVencido, valorCuota, cartilla.frecuencia_pago)
    : { texto: 'Indeterminado' };

  // Regenerar el mensaje cuando cambia el tono o los datos del cliente
  useEffect(() => {
    if (cartilla && isOpen) {
      setMensaje(generarPlantilla(tono, nombreCliente, valorVencido, atraso.texto));
    }
  }, [tono, cartilla, isOpen, valorVencido]);

  if (!isOpen || !cartilla) return null;

  // Formatear teléfono para la API de WhatsApp (código 593 Ecuador)
  const formatearTelefono = (tel) => {
    if (!tel) return '';
    let limpio = tel.replace(/[^0-9]/g, '');
    // Si empieza con 0, reemplazamos por 593
    if (limpio.startsWith('0')) {
      limpio = '593' + limpio.substring(1);
    }
    // Si no tiene código de país, lo agregamos
    if (!limpio.startsWith('593') && limpio.length === 9) {
      limpio = '593' + limpio;
    }
    return limpio;
  };

  // ── Descargar imagen de la cartilla ──
  const handleDescargarImagen = async () => {
    if (!cartillaRenderRef.current) return;
    setGenerandoImagen(true);

    try {
      const dataUrl = await toPng(cartillaRenderRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `EstadoDeCuenta_${nombreCliente.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generando imagen de la cartilla:', err);
      toast.error('No se pudo generar la imagen. Intente nuevamente.');
    } finally {
      setGenerandoImagen(false);
    }
  };

  // ── Abrir WhatsApp Web con captura de cartilla al portapapeles ──
  const handleAbrirWhatsApp = async () => {
    if (!cartillaRenderRef.current) return;
    setEnviandoWhatsapp(true);

    try {
      toast.loading('Preparando cartilla...', { id: 'whatsapp' });
      // 1. Capturar el componente de impresión a Blob con html-to-image
      const blob = await toBlob(cartillaRenderRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      if (!blob) throw new Error('El blob generado está vacío.');

      // 2. Copiar al portapapeles
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      
      toast.success('¡Cartilla copiada! Pégala en el chat (Ctrl+V)', { id: 'whatsapp', duration: 4000 });

      // 3. Formatear el número de teléfono (Regla: 0 → 593)
      let phoneStr = (cartilla.telefono_principal || '').replace(/\D/g, '');
      if (phoneStr.startsWith('0')) {
        phoneStr = '593' + phoneStr.substring(1);
      } else if (!phoneStr.startsWith('593') && phoneStr.length === 9) {
        phoneStr = '593' + phoneStr;
      }

      // 4. Codificar el texto del mensaje
      const encodedText = encodeURIComponent(mensaje);

      // 5. Construir la URL de WhatsApp Web
      const whatsappUrl = phoneStr
        ? `https://web.whatsapp.com/send?phone=${phoneStr}&text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;

      // 6. Abrir WhatsApp Web en nueva pestaña
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      toast.error('No se pudo copiar la imagen automáticamente.\nPor favor descárguela e intente de nuevo.', { id: 'whatsapp', duration: 5000 });
      // Fallback: intentar abrir WhatsApp sin la imagen
      const phoneStr = formatearTelefono(cartilla.telefono_principal);
      const encodedText = encodeURIComponent(mensaje);
      const fallbackUrl = phoneStr
        ? `https://web.whatsapp.com/send?phone=${phoneStr}&text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;
      
      window.open(fallbackUrl, '_blank');
    } finally {
      setEnviandoWhatsapp(false);
    }
  };

  // ── Iconos por tipo de tono ──
  const tonoConfig = {
    amistoso: { icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Amistoso' },
    firme: { icon: FileWarning, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Firme' },
    prejudicial: { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Severo' },
  };
  const currentTono = tonoConfig[tono];

  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      {/* ── Nodo oculto de la cartilla para html2canvas ──
           Estrategia Bulletproof: Contenedor fijo 0x0 con overflow hidden en (0,0).
           Esto evita errores de viewport negativo y asegura que html2canvas pinte el elemento completo. */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', zIndex: -1 }}>
        <div 
          ref={cartillaRenderRef} 
          style={{ width: '800px', backgroundColor: '#ffffff', padding: '20px' }}
        >
          <ImpresionCartilla
            cartilla={cartilla}
            abonos={abonos}
            mode="preview"
          />
        </div>
      </div>

      {/* ── Overlay ── */}
      <div className="fixed inset-0 z-[70] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* ═══ CABECERA ═══ */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-green-50 rounded-xl shrink-0">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900 tracking-tight truncate">
                  Gestión de Cobranza — Notificación
                </h2>
                <p className="text-xs text-gray-400 truncate">
                  {nombreCliente}
                  <span className="ml-2 font-mono text-gray-300">· Cartilla #{cartilla.id_venta}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>
                Teléfono registrado:{' '}
                <span className="font-mono font-semibold text-gray-700">
                  {cartilla.telefono_principal || 'No registrado'}
                </span>
              </span>
              {!cartilla.telefono_principal && (
                <span className="ml-auto text-amber-500 font-semibold text-[10px]">
                  Se le pedirá seleccionar el contacto en WhatsApp
                </span>
              )}
            </div>
              </div>
              
            </div>
 
            <div className="flex items-center gap-2 shrink-0">
              {/* Badge de atraso */}

              {/*
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                <Clock className="w-3 h-3" />
                Atraso: {atraso.texto}
              </span>
              */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ═══ CUERPO SCROLLABLE ═══ */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-200
            [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* ── KPIs de Mora ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">Valor Vencido</p>
                <p className="text-lg font-bold text-rose-600 font-mono mt-0.5">{fmtCurrency(valorVencido)}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Saldo Pendiente</p>
                <p className="text-lg font-bold text-indigo-600 font-mono mt-0.5">{fmtCurrency(saldoPendiente)}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Cuota {cartilla.frecuencia_pago}</p>
                <p className="text-lg font-bold text-amber-700 font-mono mt-0.5">{fmtCurrency(valorCuota)}</p>
              </div>
            </div>

            {/* ── SECCIÓN 1: Selección de Tono ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tono del Mensaje
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(tonoConfig).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = tono === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTono(key)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer
                        ${isActive
                          ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                          : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">
                        {key === 'amistoso' ? 'Recordatorio' : key === 'firme' ? 'Aviso Firme' : 'Pre-Judicial'}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isActive ? cfg.bg : 'bg-gray-100'}`}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── SECCIÓN 2: Vista Previa del Mensaje ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vista Previa del Mensaje
              </label>
              <textarea
                readOnly
                value={mensaje}
                rows={10}
                className="w-full bg-gray-50 text-gray-700 p-4 rounded-xl text-sm leading-relaxed border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-gray-200
                  [&::-webkit-scrollbar-thumb]:rounded-full"
                onClick={(e) => e.target.select()}
              />
              {/* <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Haga clic en el texto para seleccionarlo y copiarlo manualmente si lo necesita.
              </p> */}
            </div>

            {/* ── SECCIÓN 3: Adjunto ── 
            <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${currentTono.border} ${currentTono.bg}`}>
              <div className="p-2 bg-white/60 rounded-lg shrink-0">
                <Image className="w-5 h-5 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  Adjunto: Captura de Cartilla Actualizada
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Descargue la imagen y adjúntela manualmente al chat de WhatsApp. Formato PNG, alta resolución.
                </p>
              </div>
            </div>

            */}

            {/* ── Info del Teléfono ── */}
            
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            {/* Botón Secundario: Descargar Imagen */}
            <button
              onClick={handleDescargarImagen}
              disabled={generandoImagen}
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {generandoImagen ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Descargar Imagen de Cartilla
                </>
              )}
            </button>

            {/* Botón Primario: Abrir WhatsApp (con captura al portapapeles) */}
            <button
              onClick={handleAbrirWhatsApp}
              disabled={enviandoWhatsapp}
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviandoWhatsapp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generando y copiando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Abrir WhatsApp Web
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
