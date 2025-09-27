import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Copy, Check } from 'lucide-react';

interface QRCodeGeneratorProps {
  devoteeId: string;
  devoteeName: string;
  devoteeEmail: string;
  devoteeRole: string;
  onClose?: () => void;
}

export default function QRCodeGenerator({ 
  devoteeId, 
  devoteeName, 
  devoteeEmail, 
  devoteeRole, 
  onClose 
}: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  // Generate QR code data
  const qrData = {
    id: devoteeId,
    name: devoteeName,
    email: devoteeEmail,
    role: devoteeRole,
    type: 'devotee_profile',
    timestamp: new Date().toISOString()
  };

  useEffect(() => {
    generateQRCode();
  }, [devoteeId]);

  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      const qrString = JSON.stringify(qrData);
      const dataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${devoteeName.replace(/\s+/g, '_')}_QR_Code.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const copyQRData = () => {
    navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printIDCard = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Devotee ID Card - ${devoteeName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              background: white;
            }
            .id-card {
              width: 3.375in;
              height: 2.125in;
              border: 2px solid #333;
              border-radius: 8px;
              padding: 15px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              position: relative;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .temple-name {
              font-size: 14px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .card-title {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              height: 100px;
            }
            .devotee-info {
              flex: 1;
            }
            .devotee-name {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .devotee-role {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .devotee-id {
              font-size: 10px;
              color: #9ca3af;
              font-family: monospace;
            }
            .qr-code {
              width: 80px;
              height: 80px;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              padding: 5px;
              background: white;
            }
            .footer {
              position: absolute;
              bottom: 5px;
              left: 15px;
              right: 15px;
              text-align: center;
              font-size: 8px;
              color: #9ca3af;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .id-card { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="header">
              <div class="temple-name">Temple Devotee Committee</div>
              <div class="card-title">Devotee ID Card</div>
            </div>
            <div class="content">
              <div class="devotee-info">
                <div class="devotee-name">${devoteeName}</div>
                <div class="devotee-role">${devoteeRole}</div>
                <div class="devotee-id">ID: ${devoteeId}</div>
              </div>
              <div class="qr-code">
                <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 100%; height: 100%;" />
              </div>
            </div>
            <div class="footer">
              Scan QR code to view profile • Generated on ${new Date().toLocaleDateString()}
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">QR Code for {devoteeName}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted hover:text-text transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-center mb-6">
            {isGenerating ? (
              <div className="w-64 h-64 mx-auto bg-border-light rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-white rounded-lg p-4 border border-theme">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-surface-secondary rounded-lg p-3">
              <h4 className="text-sm font-medium text-text mb-2">Devotee Information</h4>
              <div className="text-xs text-muted space-y-1">
                <div><strong>Name:</strong> {devoteeName}</div>
                <div><strong>Role:</strong> {devoteeRole}</div>
                <div><strong>Email:</strong> {devoteeEmail}</div>
                <div><strong>ID:</strong> {devoteeId}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadQRCode}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>

              <button
                onClick={printIDCard}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                Print ID Card
              </button>

              <button
                onClick={copyQRData}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
