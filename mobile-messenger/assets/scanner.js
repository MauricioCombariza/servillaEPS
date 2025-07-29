// Este script se ejecutará una vez que el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
    
    // Función para ser llamada desde Python
    window.startScanner = async (licenseKey, videoElementId, callbackName) => {
        try {
            Dynamsoft.DBR.BarcodeReader.license = licenseKey;
            const scanner = await Dynamsoft.DBR.BarcodeScanner.createInstance();

            scanner.onUniqueRead = (txt, result) => {
                // Llama de vuelta a Flet
                flet.invoke_method(callbackName, txt);
            };

            const videoContainer = document.getElementById(videoElementId);
            await scanner.setUIElement(videoContainer);
            await scanner.open();
        } catch (ex) {
            console.error(ex);
            alert(`Error del escáner: ${ex.message}`);
        }
    };
});