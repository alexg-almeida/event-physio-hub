import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';

interface Registration {
  id: string;
  nome_completo: string;
  codigo_validacao: string;
  evento_id?: string;
}

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  isOpen,
  onClose,
  registration
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && registration) {
      generateQRCode();
    }
  }, [isOpen, registration]);

  const generateQRCode = async () => {
    if (!registration) return;
    
    try {
      const url = await QRCode.toDataURL(registration.codigo_validacao, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code.",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !registration) return;

    const link = document.createElement('a');
    link.download = `qrcode-${registration.nome_completo.replace(/\s+/g, '_')}.png`;
    link.href = qrCodeUrl;
    link.click();

    toast({
      title: "Download iniciado",
      description: "O QR Code foi baixado com sucesso.",
    });
  };

  const printQRCode = () => {
    if (!qrCodeUrl || !registration) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${registration.nome_completo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              background: white;
            }
            .qrcode-container {
              background: white;
              padding: 30px;
              display: inline-block;
              margin: 20px;
            }
            .participant-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #000000;
            }
            .validation-code {
              font-size: 18px;
              color: #000000;
              margin-top: 20px;
              font-family: monospace;
              font-weight: bold;
            }
            img {
              display: block;
              margin: 0 auto;
              width: 300px;
              height: 300px;
            }
            .instructions {
              font-size: 14px;
              color: #666;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="qrcode-container">
            <div class="participant-name">${registration.nome_completo}</div>
            <img src="${qrCodeUrl}" alt="QR Code" />
            <div class="validation-code">Código: ${registration.codigo_validacao}</div>
            <div class="instructions">Apresente este QR Code na entrada do evento</div>
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
          <DialogTitle>QR Code de Validação</DialogTitle>
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

          {qrCodeUrl && (
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={downloadQRCode}
              disabled={!qrCodeUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={printQRCode}
              disabled={!qrCodeUrl}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p>Este QR Code será escaneado na entrada do evento.</p>
            <p className="mt-1">Apresente na tela do celular ou impresso.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;
