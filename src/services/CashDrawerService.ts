/**
 * Cash Drawer Service
 * Handles cash drawer operations for POS systems
 */

class CashDrawerService {
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability(): void {
    // Check if we're in a browser environment with printing capabilities
    this.isAvailable = typeof window !== 'undefined' && 
                      typeof window.print === 'function';
  }

  /**
   * Open the cash drawer using ESC/POS commands
   * This sends the standard cash drawer open command to most receipt printers
   */
  async openCashDrawer(): Promise<boolean> {
    try {
      if (!this.isAvailable) {
        console.warn('Cash drawer service not available in this environment');
        return false;
      }

      // ESC/POS command to open cash drawer (pin 2)
      // ESC p m t1 t2 (0x1B 0x70 0x00 0x32 0x96)
      const openCommand = '\x1B\x70\x00\x32\x96';
      
      // Try to send command via different methods
      await this.sendToPrinter(openCommand);
      
      console.log('Cash drawer open command sent');
      return true;
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      return false;
    }
  }

  /**
   * Send command to printer/cash drawer
   */
  private async sendToPrinter(command: string): Promise<void> {
    // Method 1: Try to use Web Serial API if available
    if ('serial' in navigator) {
      try {
        await this.sendViaWebSerial(command);
        return;
      } catch (error) {
        console.warn('Web Serial not available, trying alternative methods');
      }
    }

    // Method 2: Create a hidden iframe with the command for some printer drivers
    this.sendViaHiddenFrame(command);
  }

  /**
   * Send command via Web Serial API (modern browsers)
   */
  private async sendViaWebSerial(command: string): Promise<void> {
    try {
      // @ts-ignore - Web Serial API types might not be available
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      const writer = port.writable?.getWriter();
      if (writer) {
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(command));
        writer.releaseLock();
      }
      
      await port.close();
    } catch (error) {
      throw new Error('Failed to send via Web Serial: ' + error);
    }
  }

  /**
   * Send command via hidden frame method
   */
  private sendViaHiddenFrame(command: string): void {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      
      // Create a data URL with the ESC/POS command
      const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(command);
      iframe.src = dataUrl;
      
      document.body.appendChild(iframe);
      
      // Remove after a short delay
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    } catch (error) {
      console.error('Error sending via hidden frame:', error);
    }
  }

  /**
   * Check if cash drawer service is available
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Test cash drawer connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Send a simple test command
      await this.openCashDrawer();
      return true;
    } catch (error) {
      console.error('Cash drawer test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const cashDrawerService = new CashDrawerService();
export default cashDrawerService;