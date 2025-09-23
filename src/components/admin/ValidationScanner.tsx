import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Search, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ValidationScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationResult {
  success: boolean;
  message: string;
  participantName?: string;
  alreadyValidated?: boolean;
  validationTime?: string;
}

const ValidationScanner: React.FC<ValidationScannerProps> = ({
  isOpen,
  onClose
}) => {
  const [validationCode, setValidationCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const validateCode = async () => {
    if (!validationCode.trim()) {
      toast({
        title: "Código necessário",
        description: "Digite ou escaneie um código de validação.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setResult(null);

    try {
      // Verificar se a inscrição existe
      const { data: inscricao, error: inscricaoError } = await supabase
        .from('deller_inscricoes')
        .select('id, nome_completo, status_pagamento')
        .eq('codigo_validacao', validationCode.trim())
        .maybeSingle();

      if (inscricaoError) throw inscricaoError;

      if (!inscricao) {
        setResult({
          success: false,
          message: 'Código de validação não encontrado.'
        });
        return;
      }

      if (inscricao.status_pagamento !== 'pago') {
        setResult({
          success: false,
          message: 'Participante não possui pagamento confirmado.',
          participantName: inscricao.nome_completo
        });
        return;
      }

      // Verificar se já foi validado
      const { data: validacaoExistente, error: validacaoError } = await supabase
        .from('deller_validacoes')
        .select('validado_em')
        .eq('codigo_validacao', validationCode.trim())
        .maybeSingle();

      if (validacaoError) throw validacaoError;

      if (validacaoExistente) {
        setResult({
          success: false,
          message: 'Este código já foi validado anteriormente.',
          participantName: inscricao.nome_completo,
          alreadyValidated: true,
          validationTime: new Date(validacaoExistente.validado_em).toLocaleString('pt-BR')
        });
        return;
      }

      // Criar nova validação
      const { error: createError } = await supabase
        .from('deller_validacoes')
        .insert({
          inscricao_id: inscricao.id,
          codigo_validacao: validationCode.trim(),
          validado_por: 'Admin', // Pode ser melhorado com autenticação
          dispositivo_validacao: 'Web Admin'
        });

      if (createError) throw createError;

      setResult({
        success: true,
        message: 'Entrada validada com sucesso!',
        participantName: inscricao.nome_completo,
        validationTime: new Date().toLocaleString('pt-BR')
      });

      toast({
        title: "Validação realizada",
        description: `Entrada de ${inscricao.nome_completo} confirmada.`,
      });

      // Limpar o código após validação bem-sucedida
      setTimeout(() => {
        setValidationCode('');
        setResult(null);
      }, 3000);

    } catch (error) {
      console.error('Erro na validação:', error);
      setResult({
        success: false,
        message: 'Erro interno. Tente novamente.'
      });
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o código.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateCode();
    }
  };

  const resetScanner = () => {
    setValidationCode('');
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Validação de Entrada</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="validation-code">Código de Validação</Label>
            <div className="flex gap-2">
              <Input
                id="validation-code"
                placeholder="Digite ou escaneie o código"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="font-mono"
                autoFocus
              />
              <Button
                onClick={validateCode}
                disabled={isValidating || !validationCode.trim()}
              >
                {isValidating ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.success 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result.message}
                  </p>
                  
                  {result.participantName && (
                    <p className={`text-sm mt-1 ${
                      result.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      Participante: {result.participantName}
                    </p>
                  )}
                  
                  {result.validationTime && (
                    <p className={`text-xs mt-1 ${
                      result.success 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {result.alreadyValidated ? 'Validado em: ' : 'Validação realizada em: '}
                      {result.validationTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetScanner}>
              Limpar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p><strong>Como usar:</strong></p>
            <ul className="mt-1 space-y-1">
              <li>• Digite o código de validação manualmente</li>
              <li>• Ou use um leitor de QR Code para escanear</li>
              <li>• Pressione Enter ou clique em pesquisar</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationScanner;