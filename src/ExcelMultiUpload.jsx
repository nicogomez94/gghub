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
const DOLAR = 1300;

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
      if (!json[0]) return resolve({ data: [], totalUSD: 0, ganancia: 0 });
      const header = json[0];
      const idx = {
        guest: header.findIndex(h => h && h.toLowerCase().includes('guest name')),
        booked: header.findIndex(h => h && h.toLowerCase().includes('booked by')),
        checkin: header.findIndex(h => h && h.toLowerCase().includes('check-in')),
        checkout: header.findIndex(h => h && h.toLowerCase().includes('check-out')),
        status: header.findIndex(h => h && h.toLowerCase().includes('status')),
        price: header.findIndex(h => h && h.toLowerCase().includes('price')),
      };
      const data = json.slice(1).map(row => {
        let guest = row[idx.guest];
        if (!guest || guest === '') guest = row[idx.booked] || '';
        const price = parsePrice(row[idx.price]);
        const pagoVerdadero = price ? (price - price * 0.10).toFixed(2) : '';
        return [
          guest,
          row[idx.checkin] || '',
          row[idx.checkout] || '',
          row[idx.status] || '',
          row[idx.price] || '',
          pagoVerdadero
        ];
      });
      const totalUSD = data.reduce((acc, row) => acc + (parseFloat(row[5]) || 0), 0);
      const ganancia = (totalUSD * DOLAR) - gastoFijo;
      resolve({ data, totalUSD, ganancia });
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

  const handleFile = (e, dpto) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivos(a => ({ ...a, [dpto]: file }));
  };

  const handleProcesar = async () => {
    const nuevasTablas = {};
    const nuevoResumen = {};
    for (const dep of DEPARTAMENTOS) {
      const file = archivos[dep.key];
      if (file) {
        const { data, totalUSD, ganancia } = await procesarExcel(file, Number(gastosFijos[dep.key]) || 50000);
        nuevasTablas[dep.key] = { data, totalUSD, ganancia };
        nuevoResumen[dep.key] = { totalUSD, ganancia };
      }
    }
    setTablas(nuevasTablas);
    setResumen(nuevoResumen);
  };

  const handleToggle = (dep) => {
    setVisibles(v => ({ ...v, [dep]: !v[dep] }));
  };

  const totalFinal = Object.values(resumen).reduce((acc, r) => acc + (r.ganancia || 0), 0);

  return (
    <div className="excel-upload">
      <h2>Subir archivos Excel (uno por departamento)</h2>
      {DEPARTAMENTOS.map(dep => (
        <div key={dep.key} style={{marginBottom:'1rem'}}>
          <label style={{fontWeight:600}}>{dep.label}: </label>
          <input type="file" accept=".xlsx,.xls" onChange={e => handleFile(e, dep.key)} />
          {archivos[dep.key] && <span style={{marginLeft:'1rem'}}>{archivos[dep.key].name}</span>}
          <button style={{marginLeft:'1rem'}} onClick={() => handleToggle(dep.key)} disabled={!tablas[dep.key]}>Ver/Ocultar tabla</button>
        </div>
      ))}
      <button style={{marginTop:'1.5rem'}} onClick={handleProcesar}>Procesar archivos</button>
      {DEPARTAMENTOS.map(dep => (
        tablas[dep.key] && visibles[dep.key] && (
          <div key={dep.key+"tabla"} style={{marginTop:'2rem'}}>
            <h3>Tabla {dep.label}</h3>
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
              <strong>Gastos fijos {dep.label}: </strong>ARS {gastosFijos[dep.key]}
              <br/>
              <strong>Total Pago VERDADERO (USD): </strong>{tablas[dep.key].totalUSD?.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
              <br/>
              <strong>Ganancia neta del mes (en pesos): </strong>ARS {tablas[dep.key].ganancia?.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}
            </div>
          </div>
        )
      ))}
      {Object.keys(resumen).length > 0 && (
        <div className="ganancia-final" style={{marginTop:'2.5rem',background:'#eafbe7',border:'1px solid #b6e1a7'}}>
          <h3>Resumen final</h3>
          {DEPARTAMENTOS.map(dep => (
            <div key={dep.key}>
              <strong>{dep.label}:</strong> ARS {resumen[dep.key]?.ganancia?.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}
            </div>
          ))}
          <div style={{marginTop:'1rem',fontWeight:'bold',fontSize:'1.2rem'}}>
            Ganancia total: ARS {totalFinal.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </div>
        </div>
      )}
    </div>
  );
}
