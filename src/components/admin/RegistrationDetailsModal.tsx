import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Download, Edit, Save, X } from 'lucide-react';
import BarcodeGenerator from './BarcodeGenerator';

interface Registration {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  endereco: string;
  tratamento?: string;
  lesoes?: string;
  status_pagamento: string;
  valor_pago?: number;
  data_pagamento?: string;
  data_inscricao: string;
  codigo_validacao: string;
  qr_code_data?: string;
}

interface RegistrationDetailsModalProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const RegistrationDetailsModal: React.FC<RegistrationDetailsModalProps> = ({
  registration,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [showBarcode, setShowBarcode] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (registration) {
      setEditedStatus(registration.status_pagamento);
      setObservacoes('');
    }
  }, [registration]);

  const handleSave = async () => {
    if (!registration) return;

    try {
      const updateData: any = { status_pagamento: editedStatus };
      
      if (editedStatus === 'pago' && registration.status_pagamento !== 'pago') {
        updateData.data_pagamento = new Date().toISOString();
        updateData.valor_pago = registration.valor_pago || 0;
      }

      const { error } = await supabase
        .from('deller_inscricoes')
        .update(updateData)
        .eq('id', registration.id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status da inscrição foi atualizado com sucesso.",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da inscrição.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pago: { variant: 'default' as const, label: 'Pago' },
      pendente: { variant: 'secondary' as const, label: 'Pendente' },
      cancelado: { variant: 'destructive' as const, label: 'Cancelado' },
      expirado: { variant: 'outline' as const, label: 'Expirado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!registration) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes da Inscrição
              <div className="flex gap-2">
                {registration.status_pagamento === 'pago' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBarcode(true)}
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    Código de Barras
                  </Button>
                )}
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Dados Pessoais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                  <p className="text-foreground">{registration.nome_completo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                  <p className="text-foreground">{registration.cpf}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                  <p className="text-foreground">{registration.telefone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data de Inscrição</Label>
                  <p className="text-foreground">
                    {new Date(registration.data_inscricao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
                <p className="text-foreground">{registration.endereco}</p>
              </div>
            </div>

            {/* Informações Médicas */}
            {(registration.tratamento || registration.lesoes) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Informações Médicas</h3>
                {registration.tratamento && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tratamento</Label>
                    <p className="text-foreground">{registration.tratamento}</p>
                  </div>
                )}
                {registration.lesoes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Lesões</Label>
                    <p className="text-foreground">{registration.lesoes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Status e Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Status e Pagamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  {isEditing ? (
                    <Select value={editedStatus} onValueChange={setEditedStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="expirado">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="pt-2">
                      {getStatusBadge(registration.status_pagamento)}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Código de Validação</Label>
                  <p className="text-foreground font-mono">{registration.codigo_validacao}</p>
                </div>
                {registration.valor_pago && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor Pago</Label>
                    <p className="text-foreground">
                      R$ {Number(registration.valor_pago).toFixed(2)}
                    </p>
                  </div>
                )}
                {registration.data_pagamento && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data do Pagamento</Label>
                    <p className="text-foreground">
                      {new Date(registration.data_pagamento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {isEditing && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Observações</h3>
                <Textarea
                  placeholder="Adicione observações sobre esta inscrição..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeGenerator
        isOpen={showBarcode}
        onClose={() => setShowBarcode(false)}
        registration={registration}
      />
    </>
  );
};

export default RegistrationDetailsModal;