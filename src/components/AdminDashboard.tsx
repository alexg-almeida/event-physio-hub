import { useState } from "react";
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
  Eye
} from "lucide-react";

interface Registration {
  id: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  status: "pendente" | "pago" | "cancelado";
  dataInscricao: string;
  valorPago?: number;
}

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data - seria substituído por dados reais do backend
  const mockRegistrations: Registration[] = [
    {
      id: "1",
      nomeCompleto: "Maria Silva Santos",
      cpf: "123.456.789-00",
      telefone: "(11) 99999-9999",
      status: "pago",
      dataInscricao: "2024-01-15",
      valorPago: 50.00
    },
    {
      id: "2", 
      nomeCompleto: "João Carlos Oliveira",
      cpf: "987.654.321-00",
      telefone: "(11) 88888-8888",
      status: "pendente",
      dataInscricao: "2024-01-16"
    },
    {
      id: "3",
      nomeCompleto: "Ana Paula Costa",
      cpf: "456.789.123-00", 
      telefone: "(11) 77777-7777",
      status: "pago",
      dataInscricao: "2024-01-17",
      valorPago: 50.00
    }
  ];

  const filteredRegistrations = mockRegistrations.filter(reg =>
    reg.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.cpf.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-primary text-primary-foreground">Pago</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const stats = {
    total: mockRegistrations.length,
    pagos: mockRegistrations.filter(r => r.status === "pago").length,
    pendentes: mockRegistrations.filter(r => r.status === "pendente").length,
    receita: mockRegistrations
      .filter(r => r.status === "pago")
      .reduce((sum, r) => sum + (r.valorPago || 0), 0)
  };

  return (
    <div className="min-h-screen bg-healing-gradient p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Gerencie as inscrições do evento de fisioterapia
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
                <CreditCard className="w-8 h-8 text-primary" />
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
                        placeholder="Buscar por nome ou CPF..."
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
                  {filteredRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium text-foreground">
                          {registration.nomeCompleto}
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                          <span>CPF: {registration.cpf}</span>
                          <span>•</span>
                          <span>Tel: {registration.telefone}</span>
                          <span>•</span>
                          <span>Inscrição: {new Date(registration.dataInscricao).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {getStatusBadge(registration.status)}
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        {registration.status === "pago" && (
                          <Button variant="outline" size="sm" className="text-primary">
                            <FileText className="w-4 h-4 mr-1" />
                            Gerar QR Code
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
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