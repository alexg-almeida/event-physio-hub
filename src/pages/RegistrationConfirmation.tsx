import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Printer, Home } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface InscricaoData {
  nome_completo: string;
  codigo_validacao: string;
  qr_code_data: string;
  evento_id: string;
  status_pagamento: string;
}

const RegistrationConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inscricaoId = searchParams.get("id");
  
  const [inscricao, setInscricao] = useState<InscricaoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inscricaoId) {
      navigate("/");
      return;
    }

    const fetchInscricao = async () => {
      try {
        const { data, error } = await supabase
          .from('deller_inscricoes')
          .select('nome_completo, codigo_validacao, qr_code_data, evento_id, status_pagamento')
          .eq('id', inscricaoId)
          .single();

        if (error || !data) {
          console.error('Erro ao buscar inscrição:', error);
          navigate("/");
          return;
        }

        setInscricao(data);
      } catch (error) {
        console.error('Erro ao buscar inscrição:', error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchInscricao();
  }, [inscricaoId, navigate]);

  const handleDownload = () => {
    if (!inscricao?.qr_code_data) return;
    
    const link = document.createElement('a');
    link.href = inscricao.qr_code_data;
    link.download = `qrcode-${inscricao.codigo_validacao}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout maxWidth="7xl" centered>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
      </Layout>
    );
  }

  if (!inscricao) {
    return null;
  }

  const isEventoGratuito = inscricao.status_pagamento === 'pago';

  return (
    <Layout maxWidth="7xl" centered>
      <Card className="border-0 shadow-card-soft print:shadow-none">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <CardTitle className="text-2xl">
            {isEventoGratuito ? "Inscrição Confirmada!" : "Inscrição Realizada!"}
          </CardTitle>
          
          <CardDescription className="text-base">
            {isEventoGratuito 
              ? "Sua inscrição foi confirmada com sucesso. Apresente este QR Code no dia do evento."
              : "Aguarde as informações de pagamento. Após a confirmação do pagamento, você receberá seu QR Code."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Nome do participante */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Participante</p>
            <p className="text-lg font-semibold text-foreground">{inscricao.nome_completo}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4 py-6">
            {inscricao.qr_code_data ? (
              <>
                <div className="bg-background p-4 rounded-lg border border-border">
                  <img 
                    src={inscricao.qr_code_data} 
                    alt="QR Code da inscrição" 
                    className="w-64 h-64"
                  />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Código de Validação</p>
                  <p className="text-xl font-mono font-bold text-foreground tracking-wider">
                    {inscricao.codigo_validacao}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center p-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  O QR Code será gerado após a confirmação do pagamento.
                </p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!inscricao.qr_code_data}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar QR Code
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!inscricao.qr_code_data}
              className="w-full"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            
            <Button
              onClick={() => navigate("/")}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Início
            </Button>
          </div>

          {/* Instruções */}
          {isEventoGratuito && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                💡 Salve ou imprima este QR Code. Você precisará apresentá-lo no dia do evento para validar sua entrada.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default RegistrationConfirmation;
