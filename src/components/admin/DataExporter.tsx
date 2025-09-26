import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FinancialReport from './FinancialReport';

interface DataExporterProps {
  eventoId?: string;
}

const DataExporter: React.FC<DataExporterProps> = ({ eventoId }) => {
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Nenhum dado encontrado",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          const escapedValue = String(value).replace(/"/g, '""');
          return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Exportação concluída",
      description: `Arquivo ${filename} foi baixado com sucesso.`,
    });
  };

  const exportRegistrations = async () => {
    try {
      let query = supabase
        .from('deller_inscricoes')
        .select(`
          nome_completo,
          cpf,
          telefone,
          endereco,
          tratamento,
          lesoes,
          status_pagamento,
          valor_pago,
          data_inscricao,
          data_pagamento,
          codigo_validacao
        `);

      if (eventoId) {
        query = query.eq('evento_id', eventoId);
      }

      const { data, error } = await query.order('data_inscricao', { ascending: true });

      if (error) throw error;

      const formattedData = data.map(item => ({
        'Nome Completo': item.nome_completo,
        'CPF': item.cpf,
        'Telefone': item.telefone,
        'Endereço': item.endereco,
        'Tratamento': item.tratamento || '',
        'Lesões': item.lesoes || '',
        'Status Pagamento': item.status_pagamento,
        'Valor Pago': item.valor_pago ? `R$ ${Number(item.valor_pago).toFixed(2)}` : '',
        'Data Inscrição': new Date(item.data_inscricao).toLocaleDateString('pt-BR'),
        'Data Pagamento': item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : '',
        'Código Validação': item.codigo_validacao
      }));

      exportToCSV(formattedData, `inscricoes_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Erro ao exportar inscrições:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar as inscrições.",
        variant: "destructive",
      });
    }
  };


  const exportAttendanceList = async () => {
    try {
      let query = supabase
        .from('deller_inscricoes')
        .select(`
          nome_completo,
          cpf,
          telefone,
          codigo_validacao,
          status_pagamento
        `)
        .eq('status_pagamento', 'pago');

      if (eventoId) {
        query = query.eq('evento_id', eventoId);
      }

      const { data, error } = await query.order('nome_completo', { ascending: true });

      if (error) throw error;

      const formattedData = data.map((item, index) => ({
        'Nº': index + 1,
        'Nome Completo': item.nome_completo,
        'CPF': item.cpf,
        'Telefone': item.telefone,
        'Código Validação': item.codigo_validacao,
        'Presente': '',
        'Assinatura': ''
      }));

      exportToCSV(formattedData, `lista_presenca_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Erro ao exportar lista de presença:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar a lista de presença.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Relatório Financeiro Visual */}
      <FinancialReport eventoId={eventoId} />
      
      {/* Botões de Exportação */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Exportações</h3>
          <p className="text-sm text-muted-foreground mb-4">Exporte dados para arquivos CSV</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={exportRegistrations}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Exportar Inscrições
          </Button>

          <Button
            variant="outline"
            onClick={exportAttendanceList}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Lista de Presença
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <p><strong>Inscrições:</strong> Exporta todos os dados dos participantes.</p>
          <p><strong>Lista de Presença:</strong> Lista formatada dos participantes confirmados com código de validação.</p>
        </div>
      </div>
    </div>
  );
};

export default DataExporter;