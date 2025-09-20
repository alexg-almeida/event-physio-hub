import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  nomeCompleto: string;
  cpf: string;
  endereco: string;
  telefone: string;
  lesoes: string;
  tratamento: string;
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
  const { toast } = useToast();

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

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Inscrição realizada!",
        description: "Você será redirecionado para o pagamento.",
      });
      setIsSubmitting(false);
      // Aqui seria feita a integração com o sistema de pagamento
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-healing-gradient p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Evento de Fisioterapia</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Cadastre-se para participar de atendimentos especializados
          </p>
          
          <div className="flex justify-center gap-4 mt-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              15 de Dezembro
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Centro de Saúde
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Vagas Limitadas
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
                <li>• Evento gratuito para a comunidade</li>
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