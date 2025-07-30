import { useState } from 'react';
import * as XLSX from 'xlsx';
import './ExcelUpload.css';

// Columnas a mostrar y su orden
const COLUMNAS = [
  'Book Num',
  'Guest Name(s)',
  'Check-in',
  'Check-out',
  'Status',
  'Price',
  'Pago VERDADERO'
];

function parsePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Quitar $ y comas, cambiar , por .
    return parseFloat(value.replace(/[$]/g, '').replace(',', '.')) || 0;
  }
  return 0;
}

export default function ExcelUpload() {
  const [data, setData] = useState([]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!json[0]) return;
      // Mapear columnas a índice
      const header = json[0];
      const idx = {};
      COLUMNAS.forEach(col => {
        if (col === 'Pago VERDADERO') return;
        idx[col] = header.findIndex(h => h && h.toLowerCase().replace(/\s/g, '') === col.toLowerCase().replace(/\s/g, ''));
      });
      // Procesar filas
      const newData = json.slice(1).map(row => {
        const price = parsePrice(row[idx['Price']]);
        const pagoVerdadero = price ? (price - price * 0.10).toFixed(2) : '';
        return COLUMNAS.map(col =>
          col === 'Pago VERDADERO' ? pagoVerdadero : row[idx[col]] || ''
        );
      });
      setData(newData);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="excel-upload">
      <h2>Subir archivo Excel</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
      {data.length > 0 && (
        <div className="excel-table-wrapper">
          <table className="excel-table">
            <thead>
              <tr>
                {COLUMNAS.map((col, i) => <th key={i}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
