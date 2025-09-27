import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Search, X, User, Mail, Shield, Calendar } from 'lucide-react';

interface QRCodeScannerProps {
  onScanResult: (devoteeData: any) => void;
  onClose: () => void;
}

interface DevoteeData {
  id: string;
  name: string;
  email: string;
  role: string;
  type: string;
  timestamp: string;
}

export default function QRCodeScanner({ onScanResult, onClose }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<DevoteeData | null>(null);
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrCodeRegionId = 'qr-scanner-region';

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = () => {
    try {
      setError('');
      setIsScanning(true);
      
      scannerRef.current = new Html5QrcodeScanner(
        qrCodeRegionId,
        {
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          fps: 10,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'devotee_profile') {
              setScannedData(data);
              setIsScanning(false);
              if (scannerRef.current) {
                scannerRef.current.clear();
              }
              onScanResult(data);
            } else {
              setError('Invalid QR code. Please scan a devotee QR code.');
            }
          } catch (parseError) {
            setError('Invalid QR code format. Please scan a valid devotee QR code.');
          }
        },
        (error) => {
          // Don't show every error, only significant ones
          if (error && !error.includes('No QR code found')) {
            console.warn('QR scan error:', error);
          }
        }
      );
    } catch (err) {
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-text flex items-center gap-2">
              <Search className="w-6 h-6" />
              QR Code Scanner
            </h3>
            <button
              onClick={handleClose}
              className="text-muted hover:text-text transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!isScanning && !scannedData && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-primary" />
              </div>
              <h4 className="text-lg font-medium text-text mb-2">Scan Devotee QR Code</h4>
              <p className="text-muted mb-6">
                Click the button below to start scanning. Make sure to allow camera permissions.
              </p>
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Start Scanning
              </button>
            </div>
          )}

          {isScanning && (
            <div className="text-center">
              <div className="mb-4">
                <div id={qrCodeRegionId} className="mx-auto"></div>
              </div>
              <p className="text-muted mb-4">Position the QR code within the camera view</p>
              <button
                onClick={stopScanning}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-600 transition-colors"
              >
                Stop Scanning
              </button>
            </div>
          )}

          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
              <p className="text-error-800 text-sm">{error}</p>
              <button
                onClick={() => setError('')}
                className="mt-2 text-error-600 hover:text-error-800 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {scannedData && (
            <div className="bg-surface-secondary rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-text">Devotee Found!</h4>
                  <p className="text-muted text-sm">QR code scanned successfully</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted" />
                  <div>
                    <p className="text-sm text-muted">Name</p>
                    <p className="font-medium text-text">{scannedData.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted" />
                  <div>
                    <p className="text-sm text-muted">Email</p>
                    <p className="font-medium text-text">{scannedData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted" />
                  <div>
                    <p className="text-sm text-muted">Role</p>
                    <p className="font-medium text-text capitalize">{scannedData.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted" />
                  <div>
                    <p className="text-sm text-muted">QR Generated</p>
                    <p className="font-medium text-text">
                      {new Date(scannedData.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setScannedData(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setScannedData(null);
                    setError('');
                    startScanning();
                  }}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-600 transition-colors"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
