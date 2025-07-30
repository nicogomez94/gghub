import ExcelMultiUpload from './ExcelMultiUpload';
import GastosForm from './GastosForm';
import { useState } from 'react';
import './App.css';

function App() {
  const [pantalla, setPantalla] = useState('excel');

  return (
    <div className="App">
      <h1>Control de Reservas - Importar Excel</h1>
      <nav style={{marginBottom:'2rem'}}>
        <button onClick={() => setPantalla('excel')}>Importar Excels</button>
        <button onClick={() => setPantalla('gastos')}>Cargar Gastos Fijos</button>
      </nav>
      {pantalla === 'excel' ? <ExcelMultiUpload /> : <GastosForm />}
    </div>
  );
}

export default App;
