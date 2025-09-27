import React from 'react';
import FinancialReport from './FinancialReport';

interface DataExporterProps {
  eventoId?: string;
}

const DataExporter: React.FC<DataExporterProps> = ({ eventoId }) => {


  return (
    <div className="space-y-6">
      {/* Relatório Financeiro Visual */}
      <FinancialReport eventoId={eventoId} />
    </div>
  );
};

export default DataExporter;