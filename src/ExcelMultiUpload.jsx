import { useState } from 'react';
import * as XLSX from 'xlsx';
import './ExcelUpload.css';

const DEPARTAMENTOS = [
  { key: 'arenales', label: 'Arenales' },
  { key: 'tucuman', label: 'Tucuman' },
  { key: 'paraguay', label: 'Paraguay' }
];

const COLUMNAS = [
  'Guest Name(s)',
  'Check-in',
  'Check-out',
  'Status',
  'Price',
  'Pago VERDADERO'
];

const STORAGE_KEY = 'gastos_fijos_dptos';
const DOLAR = 1350;

function parsePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[$]/g, '').replace(',', '.')) || 0;
  }
  return 0;
}

function procesarExcel(file, gastoFijo) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!json[0]) return resolve({ data: [], totalUSD: 0, ganancia: 0, ocupacion: 0 });
      const header = json[0];
      const idx = {
        guest: header.findIndex(h => h && h.toLowerCase().includes('guest name')),
        booked: header.findIndex(h => h && h.toLowerCase().includes('booked by')),
        checkin: header.findIndex(h => h && h.toLowerCase().includes('check-in')),
        checkout: header.findIndex(h => h && h.toLowerCase().includes('check-out')),
        status: header.findIndex(h => h && h.toLowerCase().includes('status')),
        price: header.findIndex(h => h && h.toLowerCase().includes('price')),
      };
      let ocupacion = 0;
      const data = json.slice(1).map(row => {
        let guest = row[idx.guest];
        if (!guest || guest === '') guest = row[idx.booked] || '';
        const price = parsePrice(row[idx.price]);
        const pagoVerdadero = price ? (price - price * 0.10).toFixed(2) : '';
        // Calcular días ocupados
        let dias = 0;
        const checkin = row[idx.checkin];
        const checkout = row[idx.checkout];
        if (checkin && checkout) {
          const d1 = new Date(checkin);
          const d2 = new Date(checkout);
          if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
            dias = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
            if (dias < 0) dias = 0;
          }
        }
        ocupacion += dias;
        return [
          guest,
          checkin || '',
          checkout || '',
          row[idx.status] || '',
          row[idx.price] || '',
          pagoVerdadero
        ];
      });
      const totalUSD = data.reduce((acc, row) => acc + (parseFloat(row[5]) || 0), 0);
      const ganancia = (totalUSD * DOLAR) - gastoFijo;
      resolve({ data, totalUSD, ganancia, ocupacion });
    };
    reader.readAsBinaryString(file);
  });
}

export default function ExcelMultiUpload() {
  const [archivos, setArchivos] = useState({});
  const [tablas, setTablas] = useState({});
  const [visibles, setVisibles] = useState({});
  const [resumen, setResumen] = useState({});

  const gastosFijos = (() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return { arenales: 50000, tucuman: 50000, paraguay: 50000 };
  })();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    // Emparejar por nombre de archivo
    const nuevosArchivos = {};
    files.forEach(file => {
      const name = file.name.toLowerCase();
      if (name.includes('arenales')) nuevosArchivos['arenales'] = file;
      else if (name.includes('tucuman')) nuevosArchivos['tucuman'] = file;
      else if (name.includes('paraguay')) nuevosArchivos['paraguay'] = file;
    });
    setArchivos(nuevosArchivos);
  };

  const handleProcesar = async () => {
    const nuevasTablas = {};
    const nuevoResumen = {};
    const nuevosVisibles = {};
    for (const dep of DEPARTAMENTOS) {
      const file = archivos[dep.key];
      if (file) {
        const { data, totalUSD, ganancia, ocupacion } = await procesarExcel(file, Number(gastosFijos[dep.key]) || 50000);
        nuevasTablas[dep.key] = { data, totalUSD, ganancia, ocupacion };
        nuevoResumen[dep.key] = { totalUSD, ganancia, ocupacion };
        nuevosVisibles[dep.key] = false; // oculto por defecto
      }
    }
    setTablas(nuevasTablas);
    setResumen(nuevoResumen);
    setVisibles(nuevosVisibles);
  };

  const handleToggle = (dep) => {
    setVisibles(v => ({ ...v, [dep]: !v[dep] }));
  };

  const totalFinal = Object.values(resumen).reduce((acc, r) => acc + (r.ganancia || 0), 0);
  const ocupacionTotal = Object.values(resumen).reduce((acc, r) => acc + (r.ocupacion || 0), 0);

  return (
    <div className="excel-upload">
      <h2>📊 Gestión de Archivos Excel</h2>
      
      <div className="file-upload-area">
        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={handleFiles}
          placeholder="📁 Arrastra tus archivos aquí o haz clic para seleccionar"
        />
      </div>
      
      <div className="file-indicators">
        {DEPARTAMENTOS.map(dep => (
          <div 
            key={dep.key} 
            className={`file-indicator ${archivos[dep.key] ? 'has-file' : ''}`}
          >
            <div className="icon">
              {archivos[dep.key] ? '✓' : '○'}
            </div>
            <div>
              <div className="label">{dep.label}</div>
              <div className="filename">
                {archivos[dep.key]?.name || 'Sin archivo seleccionado'}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="process-button btn-primary" onClick={handleProcesar}>
        🚀 Procesar Archivos
      </button>
      {DEPARTAMENTOS.map(dep => (
        tablas[dep.key] && (
          <div key={dep.key+"tabla"} className="table-section">
            <div className="table-header">
              <h3 className="table-title">📋 Tabla {dep.label}</h3>
              <button 
                className={`table-toggle ${visibles[dep.key] ? 'expanded' : ''}`}
                onClick={() => handleToggle(dep.key)}
              >
                <span className="icon">▼</span>
                {visibles[dep.key] ? 'Ocultar tabla' : 'Ver tabla'}
              </button>
            </div>
            
            {visibles[dep.key] && (
              <div className="fade-in">
                <div className="excel-table-wrapper">
                  <table className="excel-table">
                    <thead>
                      <tr>
                        {COLUMNAS.map((col, i) => <th key={i}>{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tablas[dep.key].data.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => <td key={j}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="ganancia-final">
                  <div className="metric">
                    <strong>💰 Gastos fijos {dep.label}:</strong> ARS {Number(gastosFijos[dep.key]).toLocaleString('es-AR', {maximumFractionDigits:0})}
                  </div>
                  <div className="metric">
                    <strong>💵 Total Pago VERDADERO (USD):</strong> ${tablas[dep.key].totalUSD?.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </div>
                  <div className="metric">
                    <strong>💸 Total Pago VERDADERO (ARS):</strong> ARS {Math.round(tablas[dep.key].totalUSD * DOLAR).toLocaleString('es-AR', {maximumFractionDigits:0})}
                  </div>
                  <div className="metric">
                    <strong>📈 Ganancia neta del mes:</strong> ARS {Math.round(tablas[dep.key].ganancia)?.toLocaleString('es-AR', {maximumFractionDigits:0})}
                  </div>
                  <div className="metric">
                    <strong>📅 Días ocupados en el mes:</strong> {tablas[dep.key].ocupacion} días
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ))}
      {Object.keys(resumen).length > 0 && (
        <div className="ganancia-final summary-final">
          <h3>🎯 Resumen Mensual Consolidado</h3>
          
          {DEPARTAMENTOS.map(dep => (
            resumen[dep.key] && (
              <div key={dep.key} className="metric">
                <strong>🏢 {dep.label}:</strong> ARS {Math.round(resumen[dep.key]?.ganancia || 0).toLocaleString('es-AR', {maximumFractionDigits:0})} | 📅 Días ocupados: {resumen[dep.key]?.ocupacion}
              </div>
            )
          ))}
          
          <div className="total-highlight">
            <div style={{marginBottom:'0.5rem'}}>
              <strong>💰 Ganancia Total del Mes:</strong><br/>
              ARS {Math.round(totalFinal).toLocaleString('es-AR', {maximumFractionDigits:0})}
            </div>
            <div>
              <strong>📊 Ocupación Total:</strong> {ocupacionTotal} días
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
