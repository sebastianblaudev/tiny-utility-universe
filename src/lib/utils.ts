
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function printElement(content: HTMLElement) {
  // Get printer settings if available
  let printerSettings = { printerSize: "58mm" };
  try {
    const savedSettings = localStorage.getItem("receiptSettings");
    if (savedSettings) {
      printerSettings = JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("Error loading printer settings:", error);
  }
  
  // Set width based on printer size
  const pageWidth = printerSettings.printerSize === "80mm" ? "80mm" : "58mm";
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Imprimir</title>
        <style>
          @page { size: ${pageWidth} auto; margin: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            width: ${pageWidth};
            max-width: ${pageWidth};
            margin: 0;
            padding: 2mm;
          }
          table { width: 100%; }
          td { padding: 4px 0; }
          .border-b { border-bottom: 1px solid #eee; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
