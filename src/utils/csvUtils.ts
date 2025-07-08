
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
        
        // Skip header if present and not empty
        const startRow = rows[0].trim() ? 1 : 0;
        
        // Parse each row into an object
        const data = rows.slice(startRow).map((row) => {
          if (!row.trim()) return null; // Skip empty rows
          
          const values = row.split(',').map(value => {
            // Remove quotes and trim whitespace
            return value.replace(/^["']|["']$/g, '').trim();
          });
          
          // Create an object mapping field names to values
          const item: Record<string, any> = {};
          fields.forEach((field, index) => {
            if (index < values.length) {
              item[field] = values[index];
            }
          });
          
          return item;
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
  
  data.forEach((item, index) => {
    const rowNumber = index + 2; // +2 because we skip header and 0-indexed
    
    // Validate required fields - only name and price are required now
    if (!item.name) {
      errors.push({ row: rowNumber, message: `Fila ${rowNumber}: Falta nombre del producto` });
      return;
    }
    
    if (!item.price || isNaN(Number(item.price))) {
      errors.push({ row: rowNumber, message: `Fila ${rowNumber}: Precio inválido` });
      return;
    }
    
    // Process and format data
    const product = {
      name: item.name,
      price: Number(item.price),
      code: item.code || null,
      cost_price: item.cost_price && !isNaN(Number(item.cost_price)) ? Number(item.cost_price) : 0,
      stock: item.stock && !isNaN(Number(item.stock)) ? Number(item.stock) : 0,
      category: item.category || null,
      is_weight_based: item.is_weight_based === 'true' || item.is_weight_based === '1' || item.is_weight_based === 'yes',
      image_url: item.image_url || null
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
