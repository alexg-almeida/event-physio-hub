import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CreditCard, 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  QrCode,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Registration {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  endereco: string;
  lesoes?: string;
  tratamento?: string;
  status_pagamento: string;
  data_inscricao: string;
  valor_pago?: number;
  codigo_validacao: string;
  evento_id: string;
}

interface Evento {
  id: string;
  nome: string;
  valor_inscricao: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar evento ativo
        const { data: eventoData, error: eventoError } = await supabase
          .from('deller_eventos')
          .select('id, nome, valor_inscricao')
          .eq('status', 'ativo')
          .single();

        if (eventoError) {
          console.error('Erro ao buscar evento:', eventoError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as informações do evento.",
            variant: "destructive",
          });
        } else {
          setEvento(eventoData);

          // Buscar inscrições do evento
          const { data: inscricoesData, error: inscricoesError } = await supabase
            .from('deller_inscricoes')
            .select('*')
            .eq('evento_id', eventoData.id)
            .order('created_at', { ascending: false });

          if (inscricoesError) {
            console.error('Erro ao buscar inscrições:', inscricoesError);
            toast({
              title: "Erro",
              description: "Não foi possível carregar as inscrições.",
              variant: "destructive",
            });
          } else {
            setRegistrations(inscricoesData || []);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);
  
  const filteredRegistrations = registrations.filter(reg =>
    reg.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.cpf.includes(searchTerm) ||
    reg.telefone.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-primary text-primary-foreground">Pago</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "expirado":
        return <Badge variant="outline">Expirado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const stats = {
    total: registrations.length,
    pagos: registrations.filter(r => r.status_pagamento === "pago").length,
    pendentes: registrations.filter(r => r.status_pagamento === "pendente").length,
    receita: registrations
      .filter(r => r.status_pagamento === "pago")
      .reduce((sum, r) => sum + (r.valor_pago || evento?.valor_inscricao || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-healing-gradient p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-healing-gradient p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            {evento ? `Gerencie as inscrições do ${evento.nome}` : 'Gerencie as inscrições do evento'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-card-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Inscrições</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pagamentos Confirmados</p>
                  <p className="text-2xl font-bold text-primary">{stats.pagos}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                  <p className="text-2xl font-bold text-secondary-foreground">{stats.pendentes}</p>
                </div>
                <XCircle className="w-8 h-8 text-secondary-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {stats.receita.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inscricoes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="inscricoes">
            <Card className="border-0 shadow-card-soft">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Lista de Inscrições</CardTitle>
                    <CardDescription>
                      Gerencie todas as inscrições do evento
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar por nome, CPF ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {searchTerm ? 'Nenhuma inscrição encontrada' : 'Nenhuma inscrição ainda'}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? 'Tente buscar por outros termos.' 
                          : 'As inscrições aparecerão aqui quando forem realizadas.'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredRegistrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background rounded-lg border border-border"
                      >
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium text-foreground">
                            {registration.nome_completo}
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                            <span>CPF: {registration.cpf}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Tel: {registration.telefone}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Código: {registration.codigo_validacao}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Data: {new Date(registration.data_inscricao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          {getStatusBadge(registration.status_pagamento)}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          {registration.status_pagamento === "pago" && (
                            <Button variant="outline" size="sm" className="text-primary">
                              <QrCode className="w-4 h-4 mr-1" />
                              QR Code
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card className="border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle>Controle de Pagamentos</CardTitle>
                <CardDescription>
                  Monitore o status dos pagamentos via Asaas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Integração com Asaas
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Esta seção será ativada após conectar com a API do Asaas
                  </p>
                  <Button className="bg-medical-gradient">
                    Configurar Integração
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios">
            <Card className="border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle>Relatórios e Análises</CardTitle>
                <CardDescription>
                  Exportar dados e gerar relatórios do evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Relatório de Inscrições</div>
                      <div className="text-sm text-muted-foreground">
                        Lista completa com dados dos participantes
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Relatório Financeiro</div>
                      <div className="text-sm text-muted-foreground">
                        Controle de pagamentos e receita
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Lista de Presença</div>
                      <div className="text-sm text-muted-foreground">
                        Para controle no dia do evento
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">QR Codes de Validação</div>
                      <div className="text-sm text-muted-foreground">
                        Códigos para entrada no evento
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;