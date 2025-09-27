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
  ScanBarcode,
  DollarSign,
  CheckSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RegistrationDetailsModal from "./admin/RegistrationDetailsModal";
import DataExporter from "./admin/DataExporter";
import ValidationScanner from "./admin/ValidationScanner";
import BarcodeGenerator from "./admin/BarcodeGenerator";

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
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showValidationScanner, setShowValidationScanner] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedForBarcode, setSelectedForBarcode] = useState<Registration | null>(null);

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
            
            // Buscar quantidade de presenças confirmadas
            const inscricaoIds = inscricoesData?.map(i => i.id) || [];
            const { data: validacoesData, error: validacoesError } = await supabase
              .from('deller_validacoes')
              .select('id')
              .in('inscricao_id', inscricaoIds);
            
            if (!validacoesError) {
              setPresentes(validacoesData?.length || 0);
            }
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

  const handleViewDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRegistration(null);
  };

  const handleUpdateRegistration = () => {
    // Refresh data after update
    const fetchData = async () => {
      try {
        const { data: eventoData, error: eventoError } = await supabase
          .from('deller_eventos')
          .select('id, nome, valor_inscricao')
          .eq('status', 'ativo')
          .single();

        if (eventoError) {
          console.error('Erro ao buscar evento:', eventoError);
          return;
        }

        setEvento(eventoData);

        const { data: inscricoesData, error: inscricoesError } = await supabase
          .from('deller_inscricoes')
          .select('*')
          .eq('evento_id', eventoData.id)
          .order('created_at', { ascending: false });

        if (inscricoesError) {
          console.error('Erro ao buscar inscrições:', inscricoesError);
          return;
        }

        setRegistrations(inscricoesData || []);
        
        // Atualizar presenças
        const inscricaoIds = inscricoesData?.map(i => i.id) || [];
        const { data: validacoesData, error: validacoesError } = await supabase
          .from('deller_validacoes')
          .select('id')
          .in('inscricao_id', inscricaoIds);
        
        if (!validacoesError) {
          setPresentes(validacoesData?.length || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  };

  const handleShowBarcode = (registration: Registration) => {
    setSelectedForBarcode(registration);
    setShowBarcodeModal(true);
  };

  const handleCloseBarcodeModal = () => {
    setShowBarcodeModal(false);
    setSelectedForBarcode(null);
  };
  
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

  const [presentes, setPresentes] = useState(0);

  const stats = {
    total: registrations.length,
    pagos: registrations.filter(r => r.status_pagamento === "pago").length,
    pendentes: registrations.filter(r => r.status_pagamento === "pendente").length,
    presentes: presentes,
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
            Gerenciador de Inscrições
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
                  <p className="text-sm text-muted-foreground">Presenças Confirmadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.presentes}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Receita Card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(registration)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          {registration.status_pagamento === "pago" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-primary"
                              onClick={() => handleShowBarcode(registration)}
                            >
                              <ScanBarcode className="w-4 h-4 mr-1" />
                              Código de Barras
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

          <TabsContent value="relatorios" className="space-y-4">
            <Card className="border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle>Relatórios e Exportação</CardTitle>
                <CardDescription>
                  Gere relatórios e exporte dados do evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataExporter eventoId={evento?.id} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle>Confirmação de Presença</CardTitle>
                <CardDescription>
                  Scanner para confirmar presença no evento através do código de validação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                      Sistema de Presença Automático
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Ao validar um código, a presença é automaticamente registrada no sistema.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowValidationScanner(true)}
                    className="flex items-center gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Abrir Scanner de Presença
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RegistrationDetailsModal
        registration={selectedRegistration}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        onUpdate={handleUpdateRegistration}
      />

      <ValidationScanner
        isOpen={showValidationScanner}
        onClose={() => setShowValidationScanner(false)}
      />

      <BarcodeGenerator
        isOpen={showBarcodeModal}
        onClose={handleCloseBarcodeModal}
        registration={selectedForBarcode}
      />
    </div>
  );
};

export default AdminDashboard;