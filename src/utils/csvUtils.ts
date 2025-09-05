
/**
 * Utility functions for handling CSV files
 */

/**
 * Parse a CSV file and return an array of objects with field mappings
 * @param file The CSV file to parse
 * @param fields Array of field names that correspond to CSV columns
 * @returns Promise with parsed data or error
 */
export const parseCSV = (file: File, fields: string[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        if (!csv) {
          reject(new Error('No se pudo leer el archivo CSV'));
          return;
        }

        // Split the CSV into rows
        const rows = csv.split('\n');
        
        // Skip header row (first row) - always skip header
        const dataRows = rows.slice(1);
        
        // Parse each row into an object
        const data = dataRows.map((row) => {
          if (!row.trim()) return null; // Skip empty rows
          
          // Handle CSV with proper comma separation and quoted values
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Add the last value
          
          // Map CSV columns to expected fields based on Spanish headers
          // Spanish headers: ['Nombre', 'Categoria', 'Precio', 'Precio de Costo', 'Stock', 'Código', 'URL de Imagen']
          const fieldMapping = {
            'name': values[0] || '',
            'category': values[1] || '',
            'price': values[2] || '',
            'cost_price': values[3] || '',
            'stock': values[4] || '',
            'code': values[5] || '',
            'image_url': values[6] || ''
          };
          
          return fieldMapping;
        }).filter(Boolean); // Remove null values (empty rows)
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo CSV'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Validate product data from CSV import
 * @param data Array of product objects to validate
 * @returns Object containing valid products and validation errors
 */
export const validateProductsData = (data: any[]): { 
  validProducts: any[], 
  errors: { row: number, message: string }[] 
} => {
  const validProducts = [];
  const errors = [];
  const usedCodes = new Set<string>();
  
  data.forEach((item, index) => {
    const rowNumber = index + 2; // +2 because we skip header and 0-indexed
    
    // Validate required fields
    if (!item.name || item.name.trim() === '') {
      errors.push({ row: rowNumber, message: `Fila ${rowNumber}: Falta nombre del producto` });
      return;
    }
    
    if (!item.price || isNaN(Number(item.price)) || Number(item.price) <= 0) {
      errors.push({ row: rowNumber, message: `Fila ${rowNumber}: Precio inválido (debe ser mayor a 0)` });
      return;
    }
    
    // Generate automatic code if not provided
    let productCode = item.code?.trim();
    if (!productCode) {
      // Generate code from name: first 3 letters + random number
      const namePrefix = item.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      productCode = `${namePrefix}${randomNum}`;
    }
    
    // Check for duplicate codes in the CSV
    if (usedCodes.has(productCode)) {
      errors.push({ row: rowNumber, message: `Fila ${rowNumber}: Código duplicado "${productCode}"` });
      return;
    }
    usedCodes.add(productCode);
    
    // Validate numeric fields
    const costPrice = item.cost_price && !isNaN(Number(item.cost_price)) ? Number(item.cost_price) : 0;
    const stock = item.stock && !isNaN(Number(item.stock)) ? Number(item.stock) : 0;
    
    if (costPrice < 0) {
      errors.push({ row: rowNumber, message: `Fila ${rowNumber}: Precio de costo no puede ser negativo` });
      return;
    }
    
    if (stock < 0) {
      errors.push({ row: rowNumber, message: `Fila ${rowNumber}: Stock no puede ser negativo` });
      return;
    }
    
    // Process and format data
    const product = {
      name: item.name.trim(),
      price: Number(item.price),
      code: productCode,
      cost_price: costPrice,
      stock: stock,
      category: item.category?.trim() || null,
      is_weight_based: false, // Default to false for CSV imports
      image_url: item.image_url?.trim() || null
    };
    
    validProducts.push(product);
  });
  
  return { validProducts, errors };
};

/**
 * Generate a sample CSV template for product imports
 * @returns CSV content as a string
 */
export const generateProductCSVTemplate = (): string => {
  // Using Spanish column names for better user experience - now including Stock
  const headers = ['Nombre', 'Categoria', 'Precio', 'Precio de Costo', 'Stock', 'Código', 'URL de Imagen'];
  const sampleData = [
    ['Producto 1', 'Bebidas', '1000', '700', '50', 'P001', 'https://ejemplo.com/imagen1.jpg'],
    ['Producto 2', 'Snacks', '1500', '1000', '25', 'P002', ''],
    ['Producto por peso', 'Carnes', '5000', '3500', '10', 'P003', '']
  ];
  
  let csv = headers.join(',') + '\n';
  sampleData.forEach(row => {
    csv += row.join(',') + '\n';
  });
  
  return csv;
};
