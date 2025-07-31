import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import beepSound from '/beep.mp3'; // Si moviste el archivo a /public, esta es la forma correcta de obtener la URL

const QRCODE_REGION_ID = "html5-qrcode-scanner-region";

interface EscanerPaqueteProps {
  onScanSuccess: (codigo: string) => void;
}

const EscanerPaquete: React.FC<EscanerPaqueteProps> = ({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Función para iniciar el escáner, se llamará con un clic
  const startScanner = () => {
    // 1. "Desbloquear" el audio con la interacción del usuario
    //    Creamos o cargamos el audio aquí, dentro del evento de clic.
    if (!audioRef.current) {
      audioRef.current = new Audio(beepSound);
    }
    // Hacemos una llamada a play() y la pausamos inmediatamente.
    // Esto es un truco para que el navegador considere que el audio
    // ya fue "iniciado" por el usuario.
    audioRef.current.play().catch(e => console.log("Audio play failed on init:", e));
    audioRef.current.pause();

    // 2. Iniciar la lógica del escáner
    setIsScanning(true);
  };

  useEffect(() => {
    if (!isScanning || scannerRef.current) {
      return;
    }

    const html5QrcodeScanner = new Html5Qrcode(QRCODE_REGION_ID, { verbose: false });
    scannerRef.current = html5QrcodeScanner;

    const qrCodeSuccessCallback = (decodedText: string, _decodedResult: any) => {
      // Ahora esta llamada a play() debería funcionar
      audioRef.current?.play().catch(e => console.error("Error al reproducir sonido:", e));
      
      onScanSuccess(decodedText);
      setIsScanning(false); // Detenemos el escaneo en la UI
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrcodeScanner.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
      .catch(err => {
        setIsScanning(false);
        toast.error('No se pudo iniciar la cámara.');
        console.error(err);
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Fallo al detener el escáner.", err));
      }
      scannerRef.current = null;
    };
  }, [isScanning, onScanSuccess]);

  return (
    <div className="text-center">
      {isScanning ? (
        <div id={QRCODE_REGION_ID} style={{ width: '100%' }}></div>
      ) : (
        <button
          onClick={startScanner}
          className="px-6 py-3 font-bold text-white rounded-lg bg-ser hover:bg-darkser"
        >
          Iniciar Escáner
        </button>
      )}
    </div>
  );
};

export default EscanerPaquete;