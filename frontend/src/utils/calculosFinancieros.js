/**
 * calculosFinancieros.js
 * Utilidades para calcular estados de cuenta, mora y montos exigibles.
 */

/**
 * Calcula el monto exigible (lo que debe pagar para ponerse al día).
 * @param {string|Date} fechaEmision - Fecha de inicio del crédito.
 * @param {string} frecuenciaPago - 'Diario', 'Semanal', 'Quincenal', 'Mensual'
 * @param {number} valorCuota - Valor de cada cuota.
 * @param {number} totalPagado - Total acumulado de abonos.
 * @param {number} saldoPendiente - Saldo restante de la deuda.
 * @returns {number} Monto exigible (>= 0)
 */
export function calcularMontoExigible(fechaEmision, frecuenciaPago, valorCuota, totalPagado, saldoPendiente) {
  if (!fechaEmision || !frecuenciaPago || isNaN(valorCuota) || isNaN(totalPagado)) {
    return 0;
  }

  const inicio = new Date(fechaEmision);
  const hoy = new Date();
  
  // Normalizar las fechas para que solo importe la diferencia en días naturales
  inicio.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  if (hoy <= inicio) {
    return 0; // Aún no ha transcurrido tiempo
  }

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasTranscurridos = Math.floor((hoy - inicio) / msPorDia);
  
  let periodosTranscurridos = 0;

  switch (frecuenciaPago.toLowerCase()) {
    case 'diario':
      periodosTranscurridos = diasTranscurridos;
      break;
    case 'semanal':
      periodosTranscurridos = Math.floor(diasTranscurridos / 7);
      break;
    case 'quincenal':
      periodosTranscurridos = Math.floor(diasTranscurridos / 15);
      break;
    case 'mensual':
      // Cálculo preciso de meses (diferencia de años * 12 + diferencia de meses)
      periodosTranscurridos = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      // Ajustar si el día del mes actual es menor al día de emisión
      if (hoy.getDate() < inicio.getDate()) {
        periodosTranscurridos--;
      }
      break;
    default:
      periodosTranscurridos = 0;
  }

  // Prevenir periodos negativos si hay fechas inconsistentes
  if (periodosTranscurridos < 0) {
    periodosTranscurridos = 0;
  }

  const montoEsperado = periodosTranscurridos * valorCuota;
  let valorVencidoCalculado = montoEsperado - totalPagado;

  // 1. Evitar números negativos (si el cliente pagó por adelantado)
  valorVencidoCalculado = Math.max(0, valorVencidoCalculado);

  // 2. REGLA DE TECHO (Fix del Bug): La mora no puede superar el saldo real
  // Si saldoPendiente no es válido, por fallback no aplicamos techo, pero si lo es, limitamos.
  if (!isNaN(saldoPendiente) && saldoPendiente >= 0) {
    valorVencidoCalculado = Math.min(valorVencidoCalculado, saldoPendiente);
  }

  // Retornar redondeado a 2 decimales
  return valorVencidoCalculado > 0 ? parseFloat(valorVencidoCalculado.toFixed(2)) : 0;
}

/**
 * Genera el arreglo de cuotas redondeadas a múltiplos de $0.50.
 * La última cuota absorbe la diferencia (ajuste) para que la suma total sea exacta.
 * 
 * @param {number} montoTotal - El monto total a financiar.
 * @param {number} numeroCuotas - La cantidad total de cuotas.
 * @returns {number[]} Array con el valor de cada cuota.
 */
export function generarCuotas(montoTotal, numeroCuotas) {
  if (!montoTotal || !numeroCuotas || numeroCuotas <= 0) return [];

  // 1. Dividir el montoTotal entre el numeroCuotas para obtener la cuota base
  const cuotaBase = montoTotal / numeroCuotas;

  // 2. Redondear al múltiplo de 0.50 más cercano
  // Multiplicar por 2, redondear al entero más cercano y dividir entre 2
  const cuotaRedondeada = Math.round(cuotaBase * 2) / 2;

  const cuotas = [];
  let sumaAcumulada = 0;

  // 3. Asignar el valor redondeado a todas las cuotas EXCEPTO a la última
  for (let i = 0; i < numeroCuotas - 1; i++) {
    cuotas.push(cuotaRedondeada);
    sumaAcumulada += cuotaRedondeada;
  }

  // 4. La última cuota es de ajuste (restar la suma acumulada al monto total)
  // Usamos parseFloat y toFixed para evitar errores de precisión de punto flotante de JS
  const ultimaCuota = parseFloat((montoTotal - sumaAcumulada).toFixed(2));
  cuotas.push(ultimaCuota);

  return cuotas;
}
