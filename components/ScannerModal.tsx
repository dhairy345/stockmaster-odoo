
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, ScanBarcode, AlertCircle } from 'lucide-react';

interface ScannerModalProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onScan, onClose }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const scannerId = "html5qr-code-full-region";
        let isMounted = true;

        const startScanning = async () => {
            try {
                 // Delay to ensure DOM element is ready
                 await new Promise(r => setTimeout(r, 100));
                 if (!isMounted) return;
                 
                 // cleanup previous instance if any (safety check)
                 if (scannerRef.current) {
                     try { await scannerRef.current.clear(); } catch (e) { /* ignore */ }
                 }

                 const html5QrCode = new Html5Qrcode(scannerId);
                 scannerRef.current = html5QrCode;

                 await html5QrCode.start(
                    { facingMode: "environment" },
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        if (isMounted) {
                            // Stop scanning immediately to prevent duplicate reads
                            isScanningRef.current = false;
                            html5QrCode.stop().then(() => {
                                html5QrCode.clear();
                                onScan(decodedText);
                            }).catch(err => {
                                console.warn("Stop failed", err);
                                // Even if stop fails, return the result
                                onScan(decodedText);
                            });
                        }
                    },
                    () => {} // Verbose logging off
                 );
                 
                 // Mark as running only if start succeeded and still mounted
                 if (isMounted) {
                    isScanningRef.current = true;
                 } else {
                    // If unmounted during start, clean up immediately
                    await html5QrCode.stop();
                    html5QrCode.clear();
                 }

            } catch (err: any) {
                if (!isMounted) return;
                console.error("Scanner error:", err);
                isScanningRef.current = false;
                
                if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
                    setError("Camera permission denied. Please allow camera access.");
                } else if (err?.name === 'NotFoundError') {
                    setError("No camera found on this device.");
                } else {
                    setError("Unable to start camera. Please check permissions.");
                }
            }
        };

        startScanning();

        return () => {
            isMounted = false;
            // Cleanup logic: Only stop if we are actually scanning
            if (scannerRef.current) {
                if (isScanningRef.current) {
                    scannerRef.current.stop().catch(err => {
                        // "Scanner is not running" error is harmless here
                        console.warn("Cleanup stop error", err);
                    }).finally(() => {
                         scannerRef.current?.clear();
                    });
                } else {
                    // If not running (failed start or already stopped), just clear DOM
                    try {
                        scannerRef.current.clear();
                    } catch (e) {
                        console.warn("Failed to clear scanner", e);
                    }
                }
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col">
                
                {/* Camera Area */}
                <div className="bg-black relative h-[400px] w-full flex items-center justify-center overflow-hidden">
                    
                    {!error && <div id="html5qr-code-full-region" className="w-full h-full object-cover"></div>}
                    
                    {/* Error Display */}
                    {error && (
                        <div className="absolute inset-0 z-30 bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-white font-bold text-lg mb-2">Scanner Error</p>
                            <p className="text-slate-400 text-sm mb-6">{error}</p>
                            <button onClick={onClose} className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-200">
                                Close
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {!error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/50 pointer-events-none -z-0">
                            <Loader2 className="animate-spin" size={32} />
                            <span className="text-xs font-bold uppercase tracking-widest">Starting Camera...</span>
                        </div>
                    )}

                    {/* Visual Overlay */}
                    {!error && (
                        <div className="absolute inset-0 pointer-events-none border-[40px] border-slate-900/50 z-10">
                            <div className="w-full h-full border-2 border-white/50 relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500"></div>
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 z-50 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Footer Instructions */}
                <div className="p-8 bg-white text-center">
                    <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ScanBarcode size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Scan Product SKU</h3>
                    <p className="text-slate-500 font-medium text-sm">Align the barcode or QR code within the frame to scan automatically.</p>
                </div>
            </div>
        </div>
    );
};
