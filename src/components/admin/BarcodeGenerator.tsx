import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useToast } from '@/hooks/use-toast';

interface Registration {
  id: string;
  nome_completo: string;
  codigo_validacao: string;
  evento_id?: string;
}

interface BarcodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  isOpen,
  onClose,
  registration
}) => {
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && registration) {
      generateBarcode();
    }
  }, [isOpen, registration]);

  const generateBarcode = async () => {
    if (!registration) return;
    
    try {
      const canvas = document.createElement('canvas');
      
      JsBarcode(canvas, registration.codigo_validacao, {
        format: "CODE39",
        width: 2,
        height: 100,
        displayValue: true,
        font: "Arial",
        fontSize: 16,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 10,
        fontOptions: "",
        background: "#ffffff",
        lineColor: "#1e40af" // Azul do Fisio Deller
      });

      const url = canvas.toDataURL('image/png');
      setBarcodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar código de barras:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o código de barras.",
        variant: "destructive",
      });
    }
  };

  const downloadBarcode = () => {
    if (!barcodeUrl || !registration) return;

    const link = document.createElement('a');
    link.download = `codigo-barras-${registration.nome_completo.replace(/\s+/g, '_')}.png`;
    link.href = barcodeUrl;
    link.click();

    toast({
      title: "Download iniciado",
      description: "O código de barras foi baixado com sucesso.",
    });
  };

  const printBarcode = () => {
    if (!barcodeUrl || !registration) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Código de Barras - ${registration.nome_completo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .barcode-container {
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              display: inline-block;
              margin: 20px;
            }
            .participant-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1e40af;
            }
            .validation-code {
              font-size: 14px;
              color: #6b7280;
              margin-top: 10px;
              font-family: monospace;
            }
            img {
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="participant-name">${registration.nome_completo}</div>
            <img src="${barcodeUrl}" alt="Código de Barras" />
            <div class="validation-code">Código: ${registration.codigo_validacao}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Código de Barras de Validação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">
              {registration?.nome_completo}
            </h3>
            <p className="text-sm text-muted-foreground">
              Código: <span className="font-mono">{registration?.codigo_validacao}</span>
            </p>
          </div>

          {barcodeUrl && (
            <div className="flex justify-center">
              <div className="border-2 border-border rounded-lg p-4 bg-background">
                <img
                  src={barcodeUrl}
                  alt="Código de Barras"
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={downloadBarcode}
              disabled={!barcodeUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={printBarcode}
              disabled={!barcodeUrl}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p>Este código de barras será usado para validar a entrada do participante no evento.</p>
            <p className="mt-1">Mantenha-o seguro e apresente na entrada.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeGenerator;