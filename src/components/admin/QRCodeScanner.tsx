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

interface QRCodeScannerProps {
  onValidationSuccess?: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onValidationSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Detectar iOS Safari
  const isIOSSafari = () => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    return iOS && webkit && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  };

  // Detectar se está em iframe
  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };

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

      // ✅ Notificar o componente pai para atualizar o dashboard
      if (onValidationSuccess) {
        onValidationSuccess();
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
      
      // Aviso para iOS Safari em iframe
      if (isIOSSafari() && isInIframe()) {
        toast({
          title: "Limitação do iOS Safari",
          description: "Câmera pode não funcionar no preview. Teste após deploy ou use validação manual.",
          variant: "destructive",
        });
        setCameraError("iOS Safari em iframe pode não permitir acesso à câmera. Use validação manual ou teste após deploy.");
        return;
      }
      
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador');
      }

      // PASSO 1: Solicitar permissão explicitamente ANTES de inicializar Html5Qrcode
      // Isso é crítico para iOS Safari - a permissão deve ser solicitada diretamente no evento de clique
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
      } catch (permissionError: any) {
        let errorMessage = "Não foi possível acessar a câmera.";
        
        if (permissionError.name === 'NotAllowedError') {
          errorMessage = "Permissão de câmera negada. Permita o acesso à câmera nas configurações.";
        } else if (permissionError.name === 'NotFoundError') {
          errorMessage = "Nenhuma câmera encontrada no dispositivo.";
        } else if (permissionError.name === 'NotReadableError') {
          errorMessage = "Câmera está sendo usada por outro aplicativo.";
        }
        
        throw new Error(errorMessage);
      }

      // Não parar a stream - deixar Html5Qrcode gerenciá-la
      console.log('✅ Permissão de câmera obtida');
      
      // PASSO 2: Tornar elemento visível ANTES de inicializar scanner
      setIsScanning(true);
      console.log('✅ Elemento tornando visível');
      
      // Aguardar React re-renderizar o elemento de hidden para block
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // PASSO 3: Verificar se o elemento existe e está visível
      const element = document.getElementById("qr-reader");
      if (!element) {
        throw new Error('Elemento do scanner não encontrado');
      }
      console.log('✅ Elemento encontrado no DOM', element);

      // PASSO 4: Inicializar Html5Qrcode
      readerElementRef.current = true;
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      console.log('🎥 Iniciando scanner...');
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          console.log('✅ QR Code lido:', decodedText);
          validateCode(decodedText);
          stopScanning();
        },
        undefined
      );
      
      console.log('✅ Scanner iniciado com sucesso');
    } catch (error: any) {
      console.error("Erro ao iniciar scanner:", error);
      
      let errorMessage = error.message || "Não foi possível acessar a câmera.";
      
      if (error.message?.includes('https')) {
        errorMessage = "Câmera requer conexão HTTPS segura.";
      }
      
      setCameraError(errorMessage);
      
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
        {/* Renderizar elemento #qr-reader SEMPRE no DOM, escondido quando não em uso */}
        <div 
          id="qr-reader" 
          className={`w-full min-h-[400px] rounded-lg overflow-hidden border-2 border-primary ${
            isScanning ? 'block' : 'hidden'
          }`}
        />

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
            
            {/* Input manual SEMPRE disponível */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Keyboard className="h-4 w-4" />
                <span>Ou valide manualmente:</span>
              </div>
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
                variant="outline"
              >
                Validar Código
              </Button>
            </div>

            {cameraError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{cameraError}</p>
                {isIOSSafari() && isInIframe() && (
                  <p className="text-xs text-destructive/80 mt-2">
                    💡 Dica: Use a validação manual acima ou teste o app após fazer deploy.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
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
