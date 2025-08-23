import { toast } from 'sonner';

class CashDrawerService {
  
  // Comando ESC/POS estándar para abrir gaveta de dinero
  private readonly CASH_DRAWER_COMMAND = '\x1B\x70\x00\x19\xFA';
  
  async openCashDrawer(): Promise<boolean> {
    try {
      // Método 1: Intentar imprimir comando a impresora térmica por defecto
      if (this.tryPrintCommand()) {
        toast.success("Gaveta de dinero abierta");
        return true;
      }
      
      // Método 2: Fallback usando window.print con comando ESC/POS
      return this.openWithPrintFallback();
      
    } catch (error) {
      console.error("Error abriendo gaveta:", error);
      toast.error("No se pudo abrir la gaveta de dinero");
      return false;
    }
  }

  private tryPrintCommand(): boolean {
    try {
      // Crear un elemento iframe oculto para enviar comando
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head><title>Abrir Gaveta</title></head>
            <body style="margin:0;padding:0;">
              <pre style="font-family:monospace;font-size:12px;margin:0;">${this.CASH_DRAWER_COMMAND}</pre>
            </body>
          </html>
        `);
        doc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 100);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en tryPrintCommand:", error);
      return false;
    }
  }

  private openWithPrintFallback(): boolean {
    try {
      // Crear ventana popup con comando ESC/POS
      const printWindow = window.open('', '_blank', 'width=1,height=1');
      if (!printWindow) return false;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Gaveta</title>
            <style>body { margin: 0; padding: 0; }</style>
          </head>
          <body>
            <pre style="font-family:monospace;font-size:8px;">${this.CASH_DRAWER_COMMAND}</pre>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }, 100);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      return true;
    } catch (error) {
      console.error("Error en openWithPrintFallback:", error);
      return false;
    }
  }
}

export const cashDrawerService = new CashDrawerService();
export default cashDrawerService;