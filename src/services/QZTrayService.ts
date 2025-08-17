import qz from 'qz-tray';
import { toast } from 'sonner';

export interface QZTrayConfig {
  printerName?: string;
  paperWidth: '58mm' | '80mm';
  autoConnect: boolean;
}

class QZTrayService {
  private isConnected = false;
  private config: QZTrayConfig = {
    paperWidth: '80mm',
    autoConnect: true
  };

  async initialize(config?: Partial<QZTrayConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
        this.isConnected = true;
        console.log("QZ Tray conectado exitosamente");
        toast.success("Impresora conectada (QZ Tray)");
      }
      return true;
    } catch (error) {
      console.error("Error conectando QZ Tray:", error);
      toast.error("Error conectando con QZ Tray. Asegúrese de que esté ejecutándose.");
      this.isConnected = false;
      return false;
    }
  }

  async getPrinters() {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      return await qz.printers.find();
    } catch (error) {
      console.error("Error obteniendo impresoras:", error);
      return [];
    }
  }

  async printReceipt(receiptHTML: string, printerName?: string) {
    try {
      if (!this.isConnected) {
        const connected = await this.initialize();
        if (!connected) return false;
      }

      // Usar impresora configurada o la primera disponible
      let targetPrinter = printerName || this.config.printerName;
      
      if (!targetPrinter) {
        const printers = await this.getPrinters();
        if (printers.length === 0) {
          toast.error("No se encontraron impresoras disponibles");
          return false;
        }
        targetPrinter = printers[0];
        console.log(`Usando impresora por defecto: ${targetPrinter}`);
      }

      // Configurar opciones de impresión para recibos térmicos
      const config = qz.configs.create(targetPrinter, {
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        size: { 
          width: this.config.paperWidth === '58mm' ? 2.283 : 3.15, // inches
          height: 11.0 
        },
        units: 'in'
      });

      // Preparar datos de impresión
      const data = [{
        type: 'html',
        format: 'plain',
        data: receiptHTML
      }];

      await qz.print(config, data);
      toast.success(`Recibo impreso en ${targetPrinter}`);
      return true;

    } catch (error) {
      console.error("Error imprimiendo recibo:", error);
      toast.error("Error al imprimir el recibo");
      return false;
    }
  }

  async printRawCommands(commands: string[], printerName?: string) {
    try {
      if (!this.isConnected) {
        const connected = await this.initialize();
        if (!connected) return false;
      }

      let targetPrinter = printerName || this.config.printerName;
      
      if (!targetPrinter) {
        const printers = await this.getPrinters();
        if (printers.length === 0) {
          toast.error("No se encontraron impresoras disponibles");
          return false;
        }
        targetPrinter = printers[0];
      }

      const config = qz.configs.create(targetPrinter);
      const data = commands.map(cmd => ({
        type: 'raw',
        format: 'command',
        data: cmd
      }));

      await qz.print(config, data);
      return true;

    } catch (error) {
      console.error("Error enviando comandos raw:", error);
      toast.error("Error enviando comandos a la impresora");
      return false;
    }
  }

  setPrinter(printerName: string) {
    this.config.printerName = printerName;
    localStorage.setItem('qz_printer_name', printerName);
  }

  getPrinter() {
    return this.config.printerName || localStorage.getItem('qz_printer_name');
  }

  setPaperWidth(width: '58mm' | '80mm') {
    this.config.paperWidth = width;
  }

  disconnect() {
    if (qz.websocket.isActive()) {
      qz.websocket.disconnect();
      this.isConnected = false;
      console.log("QZ Tray desconectado");
    }
  }

  isQZConnected() {
    return this.isConnected && qz.websocket.isActive();
  }
}

export const qzTrayService = new QZTrayService();
export default qzTrayService;