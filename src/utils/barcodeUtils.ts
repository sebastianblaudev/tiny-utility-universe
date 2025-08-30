import JsBarcode from 'jsbarcode';

/**
 * Generates a random EAN-13 barcode
 * @returns A valid EAN-13 barcode
 */
export const generateRandomBarcode = (): string => {
  // Generate 12 random digits
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  
  // Calculate the check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  // Return the complete EAN-13 barcode
  return code + checkDigit;
};

/**
 * Validates if a barcode is a valid EAN-13
 * @param barcode The barcode to validate
 * @returns True if the barcode is valid
 */
export const isValidBarcode = (barcode: string): boolean => {
  // Check if barcode is exactly 13 digits
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }
  
  // Check the check digit
  const digits = barcode.split('').map(d => parseInt(d));
  const checkDigit = digits.pop();
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  return calculatedCheckDigit === checkDigit;
};

/**
 * Renders barcodes in the DOM
 * @param value The value to encode in the barcode
 * @param elementId The ID of the element where to render the barcode
 * @param doc Optional document object for rendering in a different document context
 */
export const renderBarcodes = (value?: string, elementId?: string, doc?: Document): void => {
  try {
    console.log("Rendering barcodes...");
    // Use provided document or fallback to window.document
    const targetDoc = doc || document;
    
    // If specific value and elementId are provided, render to that element
    if (value && elementId) {
      const element = targetDoc.getElementById(elementId);
      if (element) {
        // Create SVG element if it doesn't exist
        if (!element.querySelector('svg')) {
          const svg = targetDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
          element.appendChild(svg);
        }
        
        // Apply JsBarcode to the SVG
        JsBarcode(element.querySelector('svg'), value, {
          format: "CODE128",
          displayValue: false,  // Don't show the value below the barcode
          width: 1.2,           // Optimize bar width for receipt paper
          height: 35,           // Optimize height for receipt paper
          margin: 2,            // Reduce margins to fit better
          fontSize: 10
        });
        console.log(`Rendered barcode with value ${value} to element #${elementId}`);
        return;
      } else {
        console.warn(`Element with ID ${elementId} not found for barcode rendering`);
      }
    }
    
    // Otherwise, find all SVG elements with jsbarcode-value or data-barcode-value attribute
    const barcodeElements = targetDoc.querySelectorAll('svg[jsbarcode-value], svg[data-barcode-value]');
    
    if (barcodeElements.length === 0) {
      console.log('No barcode elements found to render');
      return;
    }
    
    console.log(`Found ${barcodeElements.length} barcode elements to render`);
    
    // Render each barcode individually to prevent one failure from affecting others
    barcodeElements.forEach((element) => {
      try {
        const value = element.getAttribute('jsbarcode-value') || element.getAttribute('data-barcode-value');
        if (value) {
          JsBarcode(element, value, {
            format: "CODE128",
            width: 1.2,           // Optimize bar width for receipt paper
            height: 35,           // Optimize height for receipt paper
            fontSize: 10,
            margin: 2,            // Reduce margins to fit better
            displayValue: false
          });
          console.log(`Successfully rendered barcode: ${value}`);
        }
      } catch (error) {
        console.error('Error rendering individual barcode:', error);
      }
    });
    
    console.log(`Rendered ${barcodeElements.length} barcodes`);
  } catch (error) {
    console.error('Error in renderBarcodes:', error);
  }
};
