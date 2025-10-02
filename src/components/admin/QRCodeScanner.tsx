import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle2, XCircle, Loader2, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  success: boolean;
  message: string;
  participantName?: string;
  validatedAt?: string;
}

const QRCodeScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementRef = useRef<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const validateCode = async (code: string) => {
    setIsValidating(true);
    
    try {
      // Buscar inscrição pelo código de validação
      const { data: inscricao, error: inscricaoError } = await supabase
        .from('deller_inscricoes')
        .select('*')
        .eq('codigo_validacao', code)
        .single();

      if (inscricaoError || !inscricao) {
        setValidationResult({
          success: false,
          message: 'Código de validação não encontrado.',
        });
        toast({
          title: "Código inválido",
          description: "Código de validação não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Verificar se o pagamento foi confirmado
      if (inscricao.status_pagamento !== 'pago') {
        setValidationResult({
          success: false,
          message: 'Pagamento não confirmado.',
          participantName: inscricao.nome_completo,
        });
        toast({
          title: "Pagamento pendente",
          description: `${inscricao.nome_completo} ainda não teve o pagamento confirmado.`,
          variant: "destructive",
        });
        return;
      }

      // Verificar se já foi validado
      const { data: validacaoExistente } = await supabase
        .from('deller_validacoes')
        .select('*')
        .eq('inscricao_id', inscricao.id)
        .single();

      if (validacaoExistente) {
        setValidationResult({
          success: false,
          message: 'Participante já teve presença confirmada.',
          participantName: inscricao.nome_completo,
          validatedAt: new Date(validacaoExistente.validado_em).toLocaleString('pt-BR'),
        });
        toast({
          title: "Já validado",
          description: `${inscricao.nome_completo} já teve presença confirmada.`,
          variant: "destructive",
        });
        return;
      }

      // Registrar validação
      const { error: validacaoError } = await supabase
        .from('deller_validacoes')
        .insert({
          inscricao_id: inscricao.id,
          codigo_validacao: code,
          validado_por: 'Sistema',
          dispositivo_validacao: 'QR Code Scanner',
        });

      if (validacaoError) {
        throw validacaoError;
      }

      setValidationResult({
        success: true,
        message: 'Presença confirmada com sucesso!',
        participantName: inscricao.nome_completo,
        validatedAt: new Date().toLocaleString('pt-BR'),
      });

      toast({
        title: "Sucesso!",
        description: `Presença de ${inscricao.nome_completo} confirmada.`,
      });

      // Vibração de feedback (se disponível)
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

    } catch (error) {
      console.error('Erro ao validar código:', error);
      setValidationResult({
        success: false,
        message: 'Erro ao validar código. Tente novamente.',
      });
      toast({
        title: "Erro",
        description: "Erro ao validar código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const startScanning = async () => {
    try {
      setValidationResult(null);
      setCameraError('');
      
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador');
      }

      // Aguardar o DOM estar pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar se o elemento existe
      const element = document.getElementById("qr-reader");
      if (!element) {
        throw new Error('Elemento do scanner não encontrado');
      }

      readerElementRef.current = true;
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          validateCode(decodedText);
          stopScanning();
        },
        undefined
      );

      setIsScanning(true);
    } catch (error: any) {
      console.error("Erro ao iniciar scanner:", error);
      
      let errorMessage = "Não foi possível acessar a câmera.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permissão de câmera negada. Permita o acesso à câmera nas configurações.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Nenhuma câmera encontrada no dispositivo.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Câmera está sendo usada por outro aplicativo.";
      } else if (error.message?.includes('https')) {
        errorMessage = "Câmera requer conexão HTTPS segura.";
      }
      
      setCameraError(errorMessage);
      setShowManualInput(true);
      
      toast({
        title: "Erro ao acessar câmera",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && readerElementRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        readerElementRef.current = false;
      } catch (error) {
        console.error("Erro ao parar scanner:", error);
      }
    }
    setIsScanning(false);
  };

  const resetScanner = () => {
    setValidationResult(null);
    setCameraError('');
    setShowManualInput(false);
    setManualCode('');
    if (isScanning) {
      stopScanning();
    }
  };

  const handleManualValidation = () => {
    if (manualCode.trim()) {
      validateCode(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Confirmar Presença
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code do participante para confirmar presença
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && !validationResult && (
          <div className="space-y-3">
            <Button 
              onClick={startScanning} 
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Abrir Câmera
            </Button>
            
            <Button 
              onClick={() => setShowManualInput(!showManualInput)} 
              variant="outline"
              className="w-full"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Inserir Código Manualmente
            </Button>

            {showManualInput && (
              <div className="space-y-2 pt-2">
                <Input
                  placeholder="Digite o código do QR Code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualValidation()}
                  className="h-12"
                />
                <Button 
                  onClick={handleManualValidation}
                  className="w-full"
                  disabled={!manualCode.trim()}
                >
                  Validar Código
                </Button>
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{cameraError}</p>
              </div>
            )}
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div 
              id="qr-reader" 
              className="w-full rounded-lg overflow-hidden border-2 border-primary"
            />
            <Button 
              onClick={stopScanning} 
              variant="outline" 
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        )}

        {isValidating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {validationResult && (
          <div className={`p-6 rounded-lg border-2 ${
            validationResult.success 
              ? 'bg-green-50 border-green-500 dark:bg-green-950/30' 
              : 'bg-red-50 border-red-500 dark:bg-red-950/30'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {validationResult.success ? (
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <h3 className={`font-bold text-lg ${
                  validationResult.success 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {validationResult.success ? 'Sucesso!' : 'Atenção'}
                </h3>
                <p className={`text-sm ${
                  validationResult.success 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {validationResult.message}
                </p>
              </div>
            </div>

            {validationResult.participantName && (
              <div className="mt-4 space-y-1">
                <p className="font-semibold text-foreground">
                  {validationResult.participantName}
                </p>
                {validationResult.validatedAt && (
                  <p className="text-sm text-muted-foreground">
                    Validado em: {validationResult.validatedAt}
                  </p>
                )}
              </div>
            )}

            <Button 
              onClick={resetScanner} 
              className="w-full mt-4"
              variant={validationResult.success ? "default" : "outline"}
            >
              Escanear Novo QR Code
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <p>• Posicione o QR Code na área de leitura</p>
          <p>• Mantenha o celular estável</p>
          <p>• A leitura é automática</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
