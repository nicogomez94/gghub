import ExcelMultiUpload from './ExcelMultiUpload';
import GastosForm from './GastosForm';
import { useState } from 'react';
import './App.css';

function App() {
  const [pantalla, setPantalla] = useState('excel');

  return (
    <div className="App">
      <h1>🏢 Control de Reservas - Gestión de Departamentos</h1>
      <nav>
        <button 
          className={pantalla === 'excel' ? 'active' : ''} 
          onClick={() => setPantalla('excel')}
        >
          📊 Importar Excels
        </button>
        <button 
          className={pantalla === 'gastos' ? 'active' : ''} 
          onClick={() => setPantalla('gastos')}
        >
          💰 Gastos Fijos
        </button>
      </nav>
      <div className="fade-in">
        {pantalla === 'excel' ? <ExcelMultiUpload /> : <GastosForm />}
      </div>
    </div>
  );
}

export default App;
