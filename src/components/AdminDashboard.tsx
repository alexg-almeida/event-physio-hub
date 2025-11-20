import { useState, useEffect, useMemo } from "react";
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
  CheckSquare,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RegistrationDetailsModal from "./admin/RegistrationDetailsModal";
import DataExporter from "./admin/DataExporter";
import QRCodeGenerator from "./admin/QRCodeGenerator";
import QRCodeScanner from "./admin/QRCodeScanner";
import { EventManagement } from "./admin/EventManagement";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

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
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEventoFilter, setSelectedEventoFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedForBarcode, setSelectedForBarcode] = useState<Registration | null>(null);
  const [deleteInscricao, setDeleteInscricao] = useState<Registration | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar todos os eventos
        const { data: eventosData, error: eventosError } = await supabase
          .from('deller_eventos')
          .select('id, nome, valor_inscricao')
          .order('data_evento', { ascending: false });

        if (eventosError) {
          console.error('Erro ao buscar eventos:', eventosError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as informações dos eventos.",
            variant: "destructive",
          });
        } else {
          setEventos(eventosData || []);
          
          // Buscar evento ativo para manter compatibilidade
          const eventoAtivo = eventosData?.find(e => e.id === eventosData[0]?.id);
          if (eventoAtivo) {
            setEvento(eventoAtivo);
          }

          // Buscar todas as inscrições
          const { data: inscricoesData, error: inscricoesError } = await supabase
            .from('deller_inscricoes')
            .select('*')
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
            console.log('🔍 Buscando validações para', inscricaoIds.length, 'inscrições:', inscricaoIds);
            
            const { data: validacoesData, error: validacoesError } = await supabase
              .from('deller_validacoes')
              .select('inscricao_id')
              .in('inscricao_id', inscricaoIds)
              .limit(1000);
            
            console.log('📊 Query de validações executada');
            console.log('  - Error:', validacoesError);
            console.log('  - Data:', validacoesData);
            console.log('  - Count:', validacoesData?.length || 0);
            
            if (!validacoesError) {
              const count = validacoesData?.length || 0;
              console.log(`✅ Setando presentes para: ${count}`);
              setPresentes(count);
            } else {
              console.error('❌ Erro ao buscar validações:', validacoesError);
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

  // Atualizar presenças quando o filtro de evento mudar
  useEffect(() => {
    const updatePresentes = async () => {
      const filtered = selectedEventoFilter === "all" 
        ? registrations 
        : registrations.filter(r => r.evento_id === selectedEventoFilter);
      
      const inscricaoIds = filtered.map(i => i.id);
      
      if (inscricaoIds.length === 0) {
        setPresentes(0);
        return;
      }
      
      const { data: validacoesData, error: validacoesError } = await supabase
        .from('deller_validacoes')
        .select('inscricao_id')
        .in('inscricao_id', inscricaoIds)
        .limit(1000);
      
      if (!validacoesError) {
        setPresentes(validacoesData?.length || 0);
      }
    };
    
    updatePresentes();
  }, [selectedEventoFilter, registrations]);

  const handleViewDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRegistration(null);
  };

  const handleUpdateRegistration = async () => {
    console.log('🔄 Dashboard recebeu notificação de atualização');
    
    // Refresh data after update
    const fetchData = async () => {
      try {
        console.log('📥 Buscando dados atualizados do banco...');
        
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
        console.log(`✅ ${inscricoesData?.length || 0} inscrições carregadas`);
        
        // Atualizar presenças
        const inscricaoIds = inscricoesData?.map(i => i.id) || [];
        console.log('🔍 [UPDATE] Buscando validações para', inscricaoIds.length, 'inscrições');
        
        const { data: validacoesData, error: validacoesError } = await supabase
          .from('deller_validacoes')
          .select('inscricao_id')
          .in('inscricao_id', inscricaoIds)
          .limit(1000);
        
        console.log('📊 [UPDATE] Query de validações executada');
        console.log('  - Error:', validacoesError);
        console.log('  - Data:', validacoesData);
        console.log('  - Count:', validacoesData?.length || 0);
        
        if (!validacoesError) {
          const count = validacoesData?.length || 0;
          console.log(`✅ [UPDATE] Setando presentes para: ${count}`);
          setPresentes(count);
          console.log(`✅ ${count} presenças confirmadas`);
        } else {
          console.error('❌ [UPDATE] Erro ao buscar validações:', validacoesError);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
      }
    };

    await fetchData();
    console.log('✅ Dashboard atualizado com sucesso');
  };

  const handleShowBarcode = (registration: Registration) => {
    setSelectedForBarcode(registration);
    setShowBarcodeModal(true);
  };

  const handleCloseBarcodeModal = () => {
    setShowBarcodeModal(false);
    setSelectedForBarcode(null);
  };

  const handleDeleteInscricao = (registration: Registration) => {
    setDeleteInscricao(registration);
  };

  const confirmDeleteInscricao = async () => {
    if (!deleteInscricao) return;
    
    try {
      // 1. Verificar se tem validação
      const { data: validacoes } = await supabase
        .from('deller_validacoes')
        .select('id')
        .eq('inscricao_id', deleteInscricao.id);
      
      if (validacoes && validacoes.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Esta inscrição tem presença confirmada no evento.",
          variant: "destructive"
        });
        setDeleteInscricao(null);
        return;
      }
      
      // 2. Deletar pagamentos associados
      await supabase
        .from('deller_pagamentos')
        .delete()
        .eq('inscricao_id', deleteInscricao.id);
      
      // 3. Deletar inscrição
      const { error } = await supabase
        .from('deller_inscricoes')
        .delete()
        .eq('id', deleteInscricao.id);
      
      if (error) throw error;
      
      toast({
        title: "Inscrição excluída",
        description: "A inscrição foi removida com sucesso."
      });
      
      await handleUpdateRegistration();
    } catch (error) {
      console.error('Erro ao excluir inscrição:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a inscrição.",
        variant: "destructive"
      });
    } finally {
      setDeleteInscricao(null);
    }
  };
  
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.cpf.includes(searchTerm) ||
      reg.telefone.includes(searchTerm);
    const matchesEvento = selectedEventoFilter === "all" || reg.evento_id === selectedEventoFilter;
    return matchesSearch && matchesEvento;
  });

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

  // ✅ Usar useMemo para recalcular stats quando registrations, presentes ou filtro mudarem
  const stats = useMemo(() => {
    const filtered = selectedEventoFilter === "all" 
      ? registrations 
      : registrations.filter(r => r.evento_id === selectedEventoFilter);
    
    return {
      total: filtered.length,
      pagos: filtered.filter(r => r.status_pagamento === "pago").length,
      pendentes: filtered.filter(r => r.status_pagamento === "pendente").length,
      presentes: presentes,
      receita: filtered
        .filter(r => r.status_pagamento === "pago")
        .reduce((sum, r) => sum + (r.valor_pago || evento?.valor_inscricao || 0), 0)
    };
  }, [registrations, presentes, evento?.valor_inscricao, selectedEventoFilter]);

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

        {/* QR Code Scanner na Home */}
        <div className="mb-8">
          <QRCodeScanner onValidationSuccess={handleUpdateRegistration} />
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
                  {evento && evento.valor_inscricao === 0 ? (
                    <p className="text-lg font-bold text-muted-foreground">Evento Gratuito</p>
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      R$ {stats.receita.toFixed(2)}
                    </p>
                  )}
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inscricoes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
            <TabsTrigger value="eventos">Gestão de Eventos</TabsTrigger>
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
                <div className="mt-4">
                  <select
                    value={selectedEventoFilter}
                    onChange={(e) => setSelectedEventoFilter(e.target.value)}
                    className="w-full sm:w-[300px] h-10 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todos os eventos</option>
                    {eventos.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.nome}
                      </option>
                    ))}
                  </select>
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
                              <ScanBarcode className="w-4 w-4 mr-1" />
                              QR Code
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInscricao(registration)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eventos">
            <Card className="border-0 shadow-card-soft">
              <CardContent className="pt-6">
                <EventManagement />
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
          </TabsContent>
        </Tabs>
      </div>

      <RegistrationDetailsModal
        registration={selectedRegistration}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        onUpdate={handleUpdateRegistration}
        onDelete={() => selectedRegistration && handleDeleteInscricao(selectedRegistration)}
      />

      <QRCodeGenerator
        isOpen={showBarcodeModal}
        onClose={handleCloseBarcodeModal}
        registration={selectedForBarcode}
      />

      <AlertDialog open={deleteInscricao !== null} onOpenChange={(open) => !open && setDeleteInscricao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a inscrição de <strong>{deleteInscricao?.nome_completo}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteInscricao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;