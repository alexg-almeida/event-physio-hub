import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Calendar, MapPin, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  nomeCompleto: string;
  cpf: string;
  endereco: string;
  telefone: string;
  lesoes: string;
  tratamento: string;
}

interface Evento {
  id: string;
  nome: string;
  descricao: string;
  data_evento: string;
  local: string;
  valor_inscricao: number;
  vagas_totais: number;
  vagas_ocupadas: number;
}

const RegistrationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: "",
    cpf: "",
    endereco: "",
    telefone: "",
    lesoes: "",
    tratamento: "",
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const { data, error } = await supabase
          .from('deller_eventos')
          .select('*')
          .eq('status', 'ativo')
          .single();

        if (error) {
          console.error('Erro ao buscar evento:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as informações do evento.",
            variant: "destructive",
          });
        } else {
          setEvento(data);
        }
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [toast]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const formatted = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return formatted;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    return formatted;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    if (formatted.length <= 14) {
      handleInputChange("cpf", formatted);
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    if (formatted.length <= 15) {
      handleInputChange("telefone", formatted);
    }
  };

  const validateStep1 = () => {
    return formData.nomeCompleto && formData.cpf && formData.endereco && formData.telefone;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos antes de continuar.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.lesoes || !formData.tratamento) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, responda todas as perguntas médicas.",
        variant: "destructive",
      });
      return;
    }

    if (!evento) {
      toast({
        title: "Erro",
        description: "Informações do evento não encontradas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('deller_inscricoes')
        .insert({
          evento_id: evento.id,
          nome_completo: formData.nomeCompleto,
          cpf: formData.cpf.replace(/\D/g, ''),
          endereco: formData.endereco,
          telefone: formData.telefone.replace(/\D/g, ''),
          lesoes: formData.lesoes || null,
          tratamento: formData.tratamento || null,
          status_pagamento: 'pendente'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar inscrição:', error);
        if (error.code === '23505') {
          toast({
            title: "CPF já cadastrado",
            description: "Este CPF já foi utilizado para inscrição neste evento.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro na inscrição",
            description: "Tente novamente em alguns minutos.",
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "Inscrição realizada com sucesso!",
        description: `Código de validação: ${data.codigo_validacao}. Aguarde as informações de pagamento.`,
      });
      
      // Reset form
      setFormData({
        nomeCompleto: "",
        cpf: "",
        endereco: "",
        telefone: "",
        lesoes: "",
        tratamento: "",
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Erro ao salvar inscrição:', error);
      toast({
        title: "Erro na inscrição",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-healing-gradient p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações do evento...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-healing-gradient p-4 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-card-soft">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Evento não encontrado</h2>
            <p className="text-muted-foreground">Não há eventos ativos no momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-healing-gradient p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{evento.nome}</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {evento.descricao}
          </p>
          
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(evento.data_evento).toLocaleDateString('pt-BR')}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {evento.local}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              R$ {evento.valor_inscricao.toFixed(2)}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {evento.vagas_ocupadas}/{evento.vagas_totais} vagas
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Etapa {currentStep} de 2
            </span>
            <span className="text-sm text-muted-foreground">
              {currentStep === 1 ? "Dados Pessoais" : "Informações Médicas"}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-medical-gradient h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-card-soft border-0">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentStep === 1 ? "Dados Pessoais" : "Informações de Saúde"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 
                ? "Preencha suas informações básicas para a inscrição"
                : "Nos conte sobre seu histórico de saúde para um atendimento personalizado"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentStep === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Digite seu nome completo"
                    value={formData.nomeCompleto}
                    onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                    className="border-border focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleCPFChange(e.target.value)}
                    className="border-border focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro, cidade, CEP"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                    className="border-border focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="border-border focus:border-primary transition-colors"
                  />
                </div>

                <Button 
                  onClick={handleNextStep}
                  className="w-full bg-medical-gradient hover:opacity-90 transition-all"
                  size="lg"
                >
                  Próxima Etapa
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lesoes">Tem ou teve alguma lesão? *</Label>
                  <Textarea
                    id="lesoes"
                    placeholder="Descreva suas lesões atuais ou passadas, ou escreva 'Não' se não tiver nenhuma"
                    value={formData.lesoes}
                    onChange={(e) => handleInputChange("lesoes", e.target.value)}
                    rows={4}
                    className="border-border focus:border-primary transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tratamento">Está em tratamento ou já tratou? *</Label>
                  <Textarea
                    id="tratamento"
                    placeholder="Conte sobre tratamentos fisioterapêuticos atuais ou anteriores, ou escreva 'Não' se nunca fez"
                    value={formData.tratamento}
                    onChange={(e) => handleInputChange("tratamento", e.target.value)}
                    rows={4}
                    className="border-border focus:border-primary transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-medical-gradient hover:opacity-90 transition-all"
                    size="lg"
                  >
                    {isSubmitting ? "Processando..." : "Finalizar Inscrição"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Card className="border-0 shadow-card-soft">
            <CardContent className="p-4">
              <h3 className="font-semibold text-primary mb-2">Atendimentos Inclusos</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Avaliação postural completa</li>
                <li>• Orientações personalizadas</li>
                <li>• Exercícios terapêuticos</li>
                <li>• Consultoria em prevenção</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-card-soft">
            <CardContent className="p-4">
              <h3 className="font-semibold text-primary mb-2">Informações Importantes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Valor: R$ {evento.valor_inscricao.toFixed(2)}</li>
                <li>• Duração: 4 horas</li>
                <li>• Profissionais especializados</li>
                <li>• Certificado de participação</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;