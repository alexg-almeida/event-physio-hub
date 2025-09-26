import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FinancialData {
  id: string;
  nome_completo: string;
  status_pagamento: string;
  valor_pago?: number;
  data_pagamento?: string;
  data_inscricao: string;
}

interface FinancialReportProps {
  eventoId?: string;
}

const FinancialReport: React.FC<FinancialReportProps> = ({ eventoId }) => {
  const { toast } = useToast();
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        let query = supabase
          .from('deller_inscricoes')
          .select(`
            id,
            nome_completo,
            status_pagamento,
            valor_pago,
            data_pagamento,
            data_inscricao
          `);

        if (eventoId) {
          query = query.eq('evento_id', eventoId);
        }

        const { data, error } = await query.order('data_inscricao', { ascending: false });

        if (error) throw error;

        setFinancialData(data || []);
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados financeiros.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [eventoId, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case "pendente":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "cancelado":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case "expirado":
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const stats = {
    totalArrecadado: financialData
      .filter(item => item.status_pagamento === "pago")
      .reduce((sum, item) => sum + (item.valor_pago || 0), 0),
    totalPagos: financialData.filter(item => item.status_pagamento === "pago").length,
    totalPendentes: financialData.filter(item => item.status_pagamento === "pendente").length,
    totalCancelados: financialData.filter(item => item.status_pagamento === "cancelado").length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Relatório Financeiro</h3>
        <p className="text-sm text-muted-foreground">Resumo financeiro em tempo real</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Arrecadado</p>
                <p className="text-xl font-bold text-primary">
                  R$ {stats.totalArrecadado.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Confirmados</p>
                <p className="text-xl font-bold text-primary">{stats.totalPagos}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                <p className="text-xl font-bold text-secondary-foreground">{stats.totalPendentes}</p>
              </div>
              <Clock className="w-6 h-6 text-secondary-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="text-xl font-bold text-destructive">{stats.totalCancelados}</p>
              </div>
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada */}
      <Card className="border-0 shadow-card-soft">
        <CardHeader>
          <CardTitle>Detalhamento por Participante</CardTitle>
          <CardDescription>
            Lista completa com status de pagamento de cada inscrição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead>Data Inscrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome_completo}</TableCell>
                  <TableCell>{getStatusBadge(item.status_pagamento)}</TableCell>
                  <TableCell>
                    {item.valor_pago ? `R$ ${Number(item.valor_pago).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    {item.data_pagamento ? 
                      new Date(item.data_pagamento).toLocaleDateString('pt-BR') : 
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(item.data_inscricao).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {financialData.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum dado financeiro encontrado
              </h3>
              <p className="text-muted-foreground">
                Os dados aparecerão aqui conforme as inscrições forem realizadas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;