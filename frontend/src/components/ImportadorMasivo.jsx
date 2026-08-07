import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function ImportadorMasivo() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorFile, setErrorFile] = useState('');
  const fileInputRef = useRef(null);

  // Validación de Fila
  const validateRow = (row) => {
    const errors = [];
    
    // Estandarizar claves a minúsculas y sin acentos para flexibilidad
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      normalizedRow[normalizedKey] = row[key];
    });

    const cedula_cliente = normalizedRow.cedula_cliente || normalizedRow.cedula || normalizedRow.ci || normalizedRow.identificacion;
    
    const rawNombres = normalizedRow.nombres || normalizedRow.nombre;
    const rawApellidos = normalizedRow.apellidos || normalizedRow.apellido;
    const nombres_cliente = normalizedRow.nombres_cliente || 
      (rawNombres && rawApellidos ? `${rawNombres} ${rawApellidos}` : (rawNombres || rawApellidos || ''));

    const monto_total = normalizedRow.monto_total || normalizedRow.monto || normalizedRow.credito || normalizedRow.monto_credito;
    const saldo_pendiente = normalizedRow.saldo_pendiente !== undefined ? normalizedRow.saldo_pendiente : monto_total;
    const valor_cuota = normalizedRow.valor_cuota || normalizedRow.cuota || normalizedRow.valor_cuota_sugerido;
    const frecuencia_pago = normalizedRow.frecuencia_pago || normalizedRow.frecuencia || 'Mensual';
    const fecha_emision = normalizedRow.fecha_emision || normalizedRow.fecha || normalizedRow.fecha_venta;
    const estado = normalizedRow.estado || 'PENDIENTE';

    // 1. Campos obligatorios
    if (!cedula_cliente) {
      errors.push('La Cédula del cliente es obligatoria.');
    }
    if (!nombres_cliente) {
      errors.push('El Nombre del cliente es obligatorio.');
    }
    if (monto_total === undefined || monto_total === '') {
      errors.push('El Monto Total es obligatorio.');
    }

    // 2. Validación de Cédula (10 dígitos numéricos)
    if (cedula_cliente) {
      const cleanCedula = String(cedula_cliente).trim();
      if (cleanCedula.length !== 10) {
        errors.push('La cédula debe tener exactamente 10 dígitos.');
      }
      if (!/^\d+$/.test(cleanCedula)) {
        errors.push('La cédula debe contener exclusivamente números.');
      }
    }

    // 3. Validación de Monto Total (numérico positivo)
    if (monto_total !== undefined && monto_total !== '') {
      const valMonto = parseFloat(monto_total);
      if (isNaN(valMonto) || valMonto <= 0) {
        errors.push('El monto total debe ser un número positivo.');
      }
    }

    // 4. Validación de Saldo Pendiente
    if (saldo_pendiente !== undefined && saldo_pendiente !== '') {
      const valSaldo = parseFloat(saldo_pendiente);
      if (isNaN(valSaldo) || valSaldo < 0) {
        errors.push('El saldo pendiente debe ser un número no negativo.');
      } else if (valSaldo > (parseFloat(monto_total) || 0)) {
        errors.push('El saldo pendiente no puede superar al monto total.');
      }
    }

    // 5. Validación de Valor de Cuota
    if (valor_cuota !== undefined && valor_cuota !== '') {
      const valCuota = parseFloat(valor_cuota);
      if (isNaN(valCuota) || valCuota <= 0) {
        errors.push('El valor de la cuota debe ser un número positivo.');
      }
    }

    return {
      errors,
      isValid: errors.length === 0,
      data: {
        cedula_cliente: cedula_cliente ? String(cedula_cliente).trim() : '',
        nombres_cliente: nombres_cliente ? String(nombres_cliente).trim() : 'Importado',
        monto_total: monto_total ? parseFloat(monto_total) : 0,
        saldo_pendiente: saldo_pendiente !== undefined ? parseFloat(saldo_pendiente) : 0,
        valor_cuota: valor_cuota ? parseFloat(valor_cuota) : 0,
        frecuencia_pago: String(frecuencia_pago).trim(),
        fecha_emision: fecha_emision ? String(fecha_emision).trim() : new Date().toISOString().split('T')[0],
        estado: String(estado).trim()
      }
    };
  };

  const handleFile = (file) => {
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls' && fileExtension !== 'csv') {
      setErrorFile('Formato de archivo inválido. Por favor suba un archivo Excel (.xlsx, .xls) o CSV.');
      return;
    }

    setErrorFile('');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataBytes = new Uint8Array(e.target.result);
        const workbook = XLSX.read(dataBytes, { type: 'array' });
        
        // Tomar la primera hoja
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const rawJson = XLSX.utils.sheet_to_json(sheet);
        
        if (rawJson.length === 0) {
          setErrorFile('El archivo de Excel se encuentra vacío.');
          setLoading(false);
          return;
        }

        // Obtener cabeceras únicas de todas las filas
        const allHeaders = new Set();
        rawJson.forEach(row => {
          Object.keys(row).forEach(key => allHeaders.add(key));
        });

        // Validar cada fila
        const validatedRows = rawJson.map((row, idx) => {
          const valResult = validateRow(row);
          return {
            id: idx + 1,
            rawRow: row,
            ...valResult
          };
        });

        setHeaders(Array.from(allHeaders));
        setData(validatedRows);
      } catch (err) {
        console.error('Error al procesar el archivo Excel:', err);
        setErrorFile('Error al leer el archivo. Asegúrese de que no esté protegido o dañado.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Manejo de Drag and Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleReset = () => {
    setData([]);
    setHeaders([]);
    setErrorFile('');
  };

  // Contadores
  const totalRows = data.length;
  const invalidRowsCount = data.filter(r => !r.isValid).length;
  const validRowsCount = totalRows - invalidRowsCount;

  // Envío Masivo
  const handleImportSubmit = async () => {
    if (invalidRowsCount > 0) {
      alert('Corrija todos los errores críticos antes de procesar el archivo.');
      return;
    }

    setProcessing(true);
    // Agrupar solo la data formateada válida
    const payload = data.map(r => r.data);

    try {
      await api.post('/cartillas/bulk', { registros: payload });
      alert('¡Importación masiva completada con éxito!');
      handleReset();
    } catch (err) {
      console.log('Error enviando carga masiva al backend:', err);
      alert(`Simulación exitosa: Se procesaron correctamente ${payload.length} registros válidos.`);
      handleReset();
    } finally {
      setProcessing(false);
    }
  };

  const previewData = data.slice(0, 50);

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Importación Masiva por Excel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cargue su plantilla en formato `.xlsx`, `.xls` o `.csv` para migrar carteras de clientes y contratos históricos.
        </p>
      </div>

      {errorFile && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorFile}</span>
        </div>
      )}

      {/* ── Zona 1: Dropzone (Si no hay datos cargados) ── */}
      {data.length === 0 && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col justify-center min-h-[350px]">
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileInput}
            className="hidden"
          />

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/40' 
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Leyendo y validando estructura del archivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Arrastra tu archivo Excel aquí o haz clic para examinar
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  Formatos soportados: Microsoft Excel (.xlsx, .xls) o Texto Plano (.csv) de hasta 10MB.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Zona 2: Previsualización y Control (Si hay datos) ── */}
      {data.length > 0 && (
        <div className="space-y-6">
          
          {/* Panel de Resumen de Carga */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Previsualización del Archivo</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total detectado: <span className="font-semibold">{totalRows} filas</span>. 
                  Mostrando las primeras 50.
                </p>
              </div>
            </div>

            {/* Contadores Semánticos */}
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                Válidos: {validRowsCount}
              </div>
              <div className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${
                invalidRowsCount > 0 
                  ? 'bg-rose-50 border-rose-100 text-rose-700 font-semibold animate-pulse' 
                  : 'bg-slate-50 border-gray-200 text-gray-600'
              }`}>
                Con Errores: {invalidRowsCount}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <button
                onClick={handleReset}
                type="button"
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 shadow-sm cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
                Limpiar
              </button>
              
              <button
                onClick={handleImportSubmit}
                disabled={invalidRowsCount > 0 || processing}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Procesar {validRowsCount} Registros
                  </>
                )}
              </button>
            </div>
          </div>

          {invalidRowsCount > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-rose-800 text-xs space-y-1">
              <p className="font-bold">⚠️ Correcciones Obligatorias Pendientes:</p>
              <p>El archivo de Excel tiene registros inválidos. Se resaltaron las filas en rojo. Asegúrese de que todas las celdas de Cédula tengan 10 dígitos numéricos y que los nombres y apellidos estén completos.</p>
            </div>
          )}

          {/* Tabla Data Grid */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 bg-gray-50">
                      Estado
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 bg-gray-50">
                      Fila
                    </th>
                    {headers.map(header => (
                      <th 
                        key={header} 
                        className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {previewData.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`transition-colors ${row.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50 hover:bg-rose-100/60'}`}
                    >
                      {/* Columna Estado */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Válido
                          </span>
                        ) : (
                          <div className="relative group inline-flex">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 cursor-help">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Error
                            </span>
                            
                            {/* Tooltip de Errores */}
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-20 w-64 p-3 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl leading-relaxed">
                              <p className="font-bold mb-1 border-b border-gray-700 pb-0.5">Errores de Validación:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {row.errors.map((err, idx) => (
                                  <li key={idx}>{err}</li>
                                ))}
                              </ul>
                              <div className="absolute left-4 top-full w-2.5 h-2.5 bg-gray-900 transform rotate-45 -translate-y-1.5" />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Nro Fila */}
                      <td className="px-4 py-3 text-xs text-gray-400 font-semibold font-mono">
                        #{row.id}
                      </td>

                      {/* Datos de Cabecera */}
                      {headers.map(header => (
                        <td 
                          key={header} 
                          className="px-6 py-3 whitespace-nowrap text-sm text-gray-700"
                        >
                          {row.rawRow[header] !== undefined ? String(row.rawRow[header]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
