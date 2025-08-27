import { useState, useEffect } from 'react';
import './GastosForm.css';

const DEPARTAMENTOS = [
  { key: 'arenales', label: 'Arenales' },
  { key: 'tucuman', label: 'Tucuman' },
  { key: 'paraguay', label: 'Paraguay' }
];

const STORAGE_KEY = 'gastos_fijos_dptos';

export default function GastosForm() {
  const [gastos, setGastos] = useState({ arenales: '', tucuman: '', paraguay: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setGastos(JSON.parse(saved));
  }, []);

  const handleChange = (e) => {
    setGastos(g => ({ ...g, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gastos));
    setMsg('Gastos guardados en este navegador');
  };

  const departmentIcons = {
    arenales: 'A',
    tucuman: 'T', 
    paraguay: 'P'
  };

  return (
    <form className="gastos-form" onSubmit={handleSubmit}>
      <h2>💰 Gastos Fijos Mensuales</h2>
      
      <div className="form-grid">
        {DEPARTAMENTOS.map(dep => (
          <label key={dep.key}>
            <div className="label-text">
              <div className="department-icon">
                {departmentIcons[dep.key]}
              </div>
              <span>Departamento {dep.label}</span>
            </div>
            <input
              type="number"
              name={dep.key}
              value={gastos[dep.key]}
              onChange={handleChange}
              min="0"
              step="1"
              required
              placeholder="Ingrese el monto en ARS"
            />
          </label>
        ))}
      </div>
      
      <button type="submit" className="submit-button">
        💾 Guardar Gastos
      </button>
      
      {msg && <div className="gastos-msg">{msg}</div>}
      
      <div className="info-section">
        <h4>💡 Información</h4>
        <p>Los gastos fijos se guardan localmente en tu navegador y se utilizan para calcular las ganancias netas de cada departamento.</p>
      </div>
    </form>
  );
}
