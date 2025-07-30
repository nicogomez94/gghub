import { useState } from 'react';
import './ReservaForm.css';

const initialForm = {
  departamento: '',
  fecha: '',
  ingreso_bruto: '',
  limpieza: '',
  ropa_blanca: '',
  comisiones: '',
  otros: ''
};

export default function ReservaForm({ onSubmit }) {
  const [form, setForm] = useState(initialForm);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({
      ...form,
      ingreso_bruto: parseFloat(form.ingreso_bruto) || 0,
      limpieza: parseFloat(form.limpieza) || 0,
      ropa_blanca: parseFloat(form.ropa_blanca) || 0,
      comisiones: parseFloat(form.comisiones) || 0,
      otros: parseFloat(form.otros) || 0
    });
    setForm(initialForm);
  };

  return (
    <form className="reserva-form" onSubmit={handleSubmit}>
      <h2>Cargar Reserva</h2>
      <label>
        Departamento
        <input name="departamento" value={form.departamento} onChange={handleChange} required />
      </label>
      <label>
        Fecha (YYYY-MM-DD)
        <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
      </label>
      <label>
        Ingreso bruto
        <input name="ingreso_bruto" type="number" step="0.01" value={form.ingreso_bruto} onChange={handleChange} required />
      </label>
      <label>
        Limpieza
        <input name="limpieza" type="number" step="0.01" value={form.limpieza} onChange={handleChange} />
      </label>
      <label>
        Ropa blanca
        <input name="ropa_blanca" type="number" step="0.01" value={form.ropa_blanca} onChange={handleChange} />
      </label>
      <label>
        Comisiones
        <input name="comisiones" type="number" step="0.01" value={form.comisiones} onChange={handleChange} />
      </label>
      <label>
        Otros gastos
        <input name="otros" type="number" step="0.01" value={form.otros} onChange={handleChange} />
      </label>
      <button type="submit">Guardar reserva</button>
    </form>
  );
}
