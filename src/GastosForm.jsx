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
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setGastos(JSON.parse(saved));
  }, []);

  const handleChange = (e) => {
    setGastos(g => ({ ...g, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(gastos));
    setMsg('Gastos guardados en esta sesión');
  };

  return (
    <form className="gastos-form" onSubmit={handleSubmit}>
      <h2>Gastos fijos mensuales por departamento</h2>
      {DEPARTAMENTOS.map(dep => (
        <label key={dep.key}>
          {dep.label}
          <input
            type="number"
            name={dep.key}
            value={gastos[dep.key]}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </label>
      ))}
      <button type="submit">Guardar</button>
      {msg && <div className="gastos-msg">{msg}</div>}
    </form>
  );
}
