
import { toast } from "@/hooks/use-toast";

export interface ProductCommand {
  action: 'crear' | 'editar' | 'eliminar' | 'buscar';
  name?: string;
  price?: number;
  cost_price?: number;
  stock?: number;
  code?: string;
  category?: string;
}

export function parseVoiceCommand(text: string): ProductCommand | null {
  // Normalize text: lowercase and remove diacritics
  const normalizedText = text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  console.log("Processing voice command:", normalizedText);
  
  let command: ProductCommand | null = null;
  
  // CREATE PATTERNS - Enhanced with more natural language patterns
  if (
    normalizedText.includes("crea") || 
    normalizedText.includes("crear") || 
    normalizedText.includes("nuevo") || 
    normalizedText.includes("agregar") ||
    normalizedText.includes("añadir") ||
    normalizedText.includes("agrega") ||
    normalizedText.includes("registrar") ||
    normalizedText.includes("generar")
  ) {
    command = { action: 'crear' };
    
    // More flexible patterns for product name extraction with various phrasings
    const namePatterns = [
      // "Crea un producto llamado Coca Cola"
      /(?:crea|crear|nuevo|agregar|añadir|agrega|registrar|generar)(?:\s+(?:el|un|el producto|un producto|producto con nombre|el articulo|un articulo))?(?:\s+(?:llamado|con\s+nombre|que\s+se\s+llame|con el nombre|de\s+nombre))?[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+(?:a|con|precio|valor|de|en|por|stock|categoria|codigo|costo)|$)/i,
      
      // "Crea el producto Coca Cola Zero"
      /(?:crea|crear|nuevo|agregar|añadir|agrega|registrar|generar)(?:\s+(?:el|un|el producto|un producto))?[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+(?:a|con|precio|valor|de|en|por|stock|categoria|codigo|costo)|$)/i,
      
      // "Crea producto con nombre Coca Cola"
      /(?:producto|articulo)(?:\s+con\s+nombre)?[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+(?:a|con|precio|valor|de|en|por|stock|categoria|codigo|costo)|$)/i,
      
      // Fallback pattern
      /([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]{3,})(?:\s+(?:a|con|precio|valor|de|en|por|stock|categoria|codigo|costo)|$)/i
    ];
    
    // Try each pattern until we find a match
    for (const pattern of namePatterns) {
      const nameMatch = normalizedText.match(pattern);
      if (nameMatch && nameMatch[1]) {
        command.name = nameMatch[1].trim();
        console.log("Extracted name:", command.name);
        break;
      }
    }
    
    // Extract price with flexible patterns for different phrasings
    const pricePatterns = [
      // "con precio 20"
      /(?:con\s+precio|precio|valor|precio\s+de\s+venta|a\s+precio\s+de|por|precio\s+venta)[ \t]+(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$|cop|clp|mxn))?/i,
      
      // "a 20 pesos"
      /(?:a)[ \t]+(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$|cop|clp|mxn))/i,
      
      // standalone "20 pesos"
      /(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$))/i
    ];
    
    for (const pattern of pricePatterns) {
      const priceMatch = normalizedText.match(pattern);
      if (priceMatch && priceMatch[1]) {
        command.price = parseFloat(priceMatch[1]);
        console.log("Extracted price:", command.price);
        break;
      }
    }
    
    // Extract cost price with flexible patterns for different phrasings
    const costPatterns = [
      // "con costo 10"
      /(?:con\s+costo|costo|precio\s+de\s+costo|cuesta|costo\s+de|precio\s+costo|a\s+costo\s+de)[ \t]+(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$|cop|clp|mxn))?/i,
      
      // "con precio de costo 10"
      /(?:con\s+precio\s+de\s+costo|valor\s+de\s+compra|precio\s+compra|coste|valor\s+de\s+costo)[ \t]+(\d+(?:\.\d+)?)/i
    ];
    
    for (const pattern of costPatterns) {
      const costMatch = normalizedText.match(pattern);
      if (costMatch && costMatch[1]) {
        command.cost_price = parseFloat(costMatch[1]);
        console.log("Extracted cost price:", command.cost_price);
        break;
      }
    }
    
    // Extract stock with flexible patterns
    const stockPatterns = [
      /(?:con\s+stock|stock|inventario|existencias|cantidad)[ \t]+(\d+)(?:\s*(?:unidades|articulos|productos|stock|en stock|items))?/i,
      /(\d+)[ \t]*(?:unidades|articulos|productos|items|en existencia)/i
    ];
    
    for (const pattern of stockPatterns) {
      const stockMatch = normalizedText.match(pattern);
      if (stockMatch && stockMatch[1]) {
        command.stock = parseInt(stockMatch[1], 10);
        console.log("Extracted stock:", command.stock);
        break;
      }
    }
    
    // Extract code or barcode
    const codePatterns = [
      /(?:codigo|code|sku|código|con\s+codigo|con\s+código)[ \t]+([a-zA-Z0-9-]+)/i,
      /(?:barcode|barra|barras|codigo\s+de\s+barras|código\s+de\s+barras)[ \t]+([a-zA-Z0-9-]+)/i
    ];
    
    for (const pattern of codePatterns) {
      const codeMatch = normalizedText.match(pattern);
      if (codeMatch && codeMatch[1]) {
        command.code = codeMatch[1].trim();
        console.log("Extracted code:", command.code);
        break;
      }
    }
    
    // Extract category with flexible patterns
    const categoryPatterns = [
      /(?:categoria|categoría|categorizado como|tipo|en\s+la\s+categoria)[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+y|\s+con|$)/i,
      /(?:en|de)[ \t]+(?:la\s+)?categoria[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+y|\s+con|$)/i
    ];
    
    for (const pattern of categoryPatterns) {
      const categoryMatch = normalizedText.match(pattern);
      if (categoryMatch && categoryMatch[1]) {
        command.category = categoryMatch[1].trim();
        console.log("Extracted category:", command.category);
        break;
      }
    }
  }
  
  // SEARCH PATTERNS
  else if (
    normalizedText.includes("busca") || 
    normalizedText.includes("buscar") || 
    normalizedText.includes("encuentra") ||
    normalizedText.includes("mostrar") ||
    normalizedText.includes("filtrar")
  ) {
    command = { action: 'buscar' };
    
    // Extract search term
    const searchRegex = /(?:busca|buscar|encuentra|mostrar|filtrar)\s+(?:productos?\s+)?(?:con nombre\s+)?([a-zA-Z0-9\s]+?)(?:\s+y|\s+en|\s+con|$)/i;
    const searchMatch = normalizedText.match(searchRegex);
    if (searchMatch && searchMatch[1]) {
      command.name = searchMatch[1].trim();
    }
    
    // Extract category for filtering
    const categoryRegex = /(?:en la categoria|categoria|categoría)\s+([a-zA-Z0-9\s]+?)(?:\s+y|\s+con|$)/i;
    const categoryMatch = normalizedText.match(categoryRegex);
    if (categoryMatch && categoryMatch[1]) {
      command.category = categoryMatch[1].trim();
    }
  }
  
  // DELETE PATTERNS
  else if (
    normalizedText.includes("elimina") || 
    normalizedText.includes("eliminar") || 
    normalizedText.includes("borrar") ||
    normalizedText.includes("quitar") ||
    normalizedText.includes("remover")
  ) {
    command = { action: 'eliminar' };
    
    // Extract product name to delete
    const nameRegex = /(?:elimina|eliminar|borrar|quitar)(?:r)?\s+(?:el producto|producto|articulo|item)?\s*(?:llamado|con nombre)?\s*([a-zA-Z0-9\s]+?)(?:\s+y|\s+con|$)/i;
    const nameMatch = normalizedText.match(nameRegex);
    if (nameMatch && nameMatch[1]) {
      command.name = nameMatch[1].trim();
    }
  }
  
  // EDIT PATTERNS - Enhanced for maximum flexibility with natural language
  else if (
    normalizedText.includes("edita") || 
    normalizedText.includes("editar") || 
    normalizedText.includes("modificar") ||
    normalizedText.includes("actualizar") ||
    normalizedText.includes("cambiar") ||
    normalizedText.includes("modifica")
  ) {
    command = { action: 'editar' };
    
    // Extremely flexible product name extraction for edit commands
    const editNamePatterns = [
      // "Edita el producto llamado Coca Cola"
      /(?:edita|editar|modificar|actualizar|cambiar|modifica)(?:r)?[ \t]+(?:el producto|un producto|producto|articulo|item)?(?:[ \t]+(?:llamado|con nombre|de nombre|con el nombre))?[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:[ \t]+(?:a|con|y|precio|stock|codigo|costo|ponle|cambia|establecer|poner)|$)/i,
      
      // Simple pattern - just "Edita Coca Cola"
      /(?:edita|editar|modificar|actualizar|cambiar|modifica)(?:r)?[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:[ \t]+(?:a|con|y|precio|stock|codigo|costo|ponle|cambia|establecer|poner)|$)/i,
      
      // "El producto Coca Cola ponle precio 25"
      /(?:el producto|producto|articulo|item)[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:[ \t]+(?:a|con|y|precio|stock|codigo|costo|ponle|cambia|establecer|poner)|$)/i
    ];
    
    for (const pattern of editNamePatterns) {
      const nameMatch = normalizedText.match(pattern);
      if (nameMatch && nameMatch[1]) {
        command.name = nameMatch[1].trim();
        console.log("Edit command - Extracted name:", command.name);
        break;
      }
    }
    
    // Extract price with flexible patterns
    const pricePatterns = [
      // With various price indicators
      /(?:con\s+precio|precio|valor|precio\s+de\s+venta|a\s+precio\s+de|cambia\s+(?:el\s+)?precio\s+a|ponle\s+(?:un\s+)?precio\s+de|establecer\s+precio\s+a)[ \t]+(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$|cop|clp|mxn))?/i,
      
      // "a 25 pesos"
      /(?:a)[ \t]+(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$|cop|clp|mxn))/i,
      
      // Standalone "25 pesos"
      /(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$))/i
    ];
    
    for (const pattern of pricePatterns) {
      const priceMatch = normalizedText.match(pattern);
      if (priceMatch && priceMatch[1]) {
        command.price = parseFloat(priceMatch[1]);
        console.log("Edit command - Extracted price:", command.price);
        break;
      }
    }
    
    // Extract cost price with flexible patterns
    const costPatterns = [
      // With various cost indicators
      /(?:con\s+costo|costo|precio\s+de\s+costo|cuesta|costo\s+de|precio\s+costo|cambia\s+(?:el\s+)?costo\s+a|ponle\s+(?:un\s+)?costo\s+de|establecer\s+costo\s+a)[ \t]+(\d+(?:\.\d+)?)(?:\s*(?:pesos|peso|\$|cop|clp|mxn))?/i,
      
      // "con precio de costo 10"
      /(?:con\s+precio\s+de\s+costo|valor\s+de\s+compra|precio\s+compra|coste)[ \t]+(\d+(?:\.\d+)?)/i
    ];
    
    for (const pattern of costPatterns) {
      const costMatch = normalizedText.match(pattern);
      if (costMatch && costMatch[1]) {
        command.cost_price = parseFloat(costMatch[1]);
        console.log("Edit command - Extracted cost price:", command.cost_price);
        break;
      }
    }
    
    // Extract stock with flexible patterns
    const stockPatterns = [
      /(?:con\s+stock|stock|inventario|existencias|cantidad|cambia\s+(?:el\s+)?stock\s+a|ponle\s+(?:un\s+)?stock\s+de|establecer\s+stock\s+a)[ \t]+(\d+)(?:\s*(?:unidades|articulos|productos|stock|en stock|items))?/i,
      /(\d+)[ \t]*(?:unidades|articulos|productos|items|en existencia)/i
    ];
    
    for (const pattern of stockPatterns) {
      const stockMatch = normalizedText.match(pattern);
      if (stockMatch && stockMatch[1]) {
        command.stock = parseInt(stockMatch[1], 10);
        console.log("Edit command - Extracted stock:", command.stock);
        break;
      }
    }
    
    // Extract category with flexible patterns
    const categoryPatterns = [
      /(?:categoria|categoría|categorizado como|tipo|cambia\s+(?:la\s+)?categoria\s+a|ponle\s+(?:la\s+)?categoria\s+de|establecer\s+categoria\s+a)[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+y|\s+con|$)/i,
      /(?:en|de)[ \t]+(?:la\s+)?categoria[ \t]+([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+y|\s+con|$)/i
    ];
    
    for (const pattern of categoryPatterns) {
      const categoryMatch = normalizedText.match(pattern);
      if (categoryMatch && categoryMatch[1]) {
        command.category = categoryMatch[1].trim();
        console.log("Edit command - Extracted category:", command.category);
        break;
      }
    }
  }
  
  console.log("Parsed command:", command);
  
  // Log a warning if the command was recognized but missing essential data
  if (command) {
    if (command.action === 'crear' && (!command.name || !command.price)) {
      console.warn("Create command missing essential data:", command);
    } else if (command.action === 'editar' && (!command.name || (!command.price && !command.cost_price && !command.stock && !command.category))) {
      console.warn("Edit command missing essential data:", command);
    } else if (command.action === 'eliminar' && !command.name) {
      console.warn("Delete command missing product name:", command);
    }
  }
  
  return command;
}

export function getAutoGeneratedCode(): string {
  return `SKU${Date.now().toString().slice(-6)}`;
}

// Helper function to debug voice commands
export function debugVoiceCommand(text: string): void {
  const command = parseVoiceCommand(text);
  console.log("Voice command debug:", { original: text, parsed: command });
  
  if (!command) {
    toast({
      title: "Error",
      description: "No se pudo reconocer el comando. Intenta nuevamente.",
      variant: "destructive"
    });
    return;
  }
  
  let feedbackMessage = "";
  
  switch (command.action) {
    case 'crear':
      feedbackMessage = `Crear producto${command.name ? ': ' + command.name : ''} 
                        ${command.price ? 'a ' + command.price + ' pesos' : ''} 
                        ${command.cost_price ? 'con costo ' + command.cost_price + ' pesos' : ''}
                        ${command.stock ? 'con ' + command.stock + ' unidades' : ''} 
                        ${command.category ? 'en categoría ' + command.category : ''}`;
      break;
    case 'editar':
      feedbackMessage = `Editar producto${command.name ? ': ' + command.name : ''} 
                        ${command.price ? 'a ' + command.price + ' pesos' : ''} 
                        ${command.cost_price ? 'con costo ' + command.cost_price + ' pesos' : ''}
                        ${command.stock ? 'con ' + command.stock + ' unidades' : ''} 
                        ${command.category ? 'en categoría ' + command.category : ''}`;
      break;
    case 'eliminar':
      feedbackMessage = `Eliminar producto${command.name ? ': ' + command.name : ''}`;
      break;
    case 'buscar':
      feedbackMessage = `Buscar${command.name ? ' ' + command.name : ''} 
                        ${command.category ? 'en categoría ' + command.category : ''}`;
      break;
  }
  
  toast({
    title: "Comando detectado",
    description: feedbackMessage.replace(/\s+/g, ' ').trim()
  });
}

/**
 * Función para calcular la similitud entre dos cadenas
 * Retorna un valor entre 0 y 1, donde 1 significa coincidencia exacta
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  // Normalizar ambas cadenas: convertir a minúsculas y eliminar acentos
  const normalize = (text: string) => text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  // Si son exactamente iguales después de normalizar
  if (s1 === s2) return 1;
  
  // Si una cadena contiene exactamente a la otra, prioritize slightly longer, more specific matches
  // but only if the contained part is a significant portion of the longer string
  // This reduces false matches between products like "Completo Italiano" and "Churrasco Italiano"
  if (s1.includes(s2) && s2.length > 3) {
    // Calculate what portion of s1 is made up by s2
    const ratio = s2.length / s1.length;
    
    // If s2 is a significant portion of s1 (at least 70%), give it a high score
    // but not as high as an exact match
    if (ratio > 0.7) return 0.85;
    
    // If it's a small part, give it a lower score to avoid matching phrases 
    // that just happen to contain a word
    return 0.5 * ratio;
  }
  
  if (s2.includes(s1) && s1.length > 3) {
    const ratio = s1.length / s2.length;
    if (ratio > 0.7) return 0.85;
    return 0.5 * ratio;
  }
  
  // If the strings are very different in length, reduce the similarity more aggressively
  // This helps prevent "Completo" from matching with "Completo Italiano"
  if (Math.abs(s1.length - s2.length) > Math.min(s1.length, s2.length) * 0.3) {
    return 0.3; // Much stronger penalty for length differences
  }
  
  // Algoritmo de distancia de Levenshtein para calcular similitud
  const matrix: number[][] = [];
  
  // Inicializar la matriz
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Llenar la matriz
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // eliminación
        matrix[i][j - 1] + 1,      // inserción
        matrix[i - 1][j - 1] + cost // sustitución
      );
    }
  }
  
  // Calcular la similitud basada en la distancia
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1; // Si ambas cadenas están vacías
  
  const distance = matrix[s1.length][s2.length];
  const similarity = 1 - distance / maxLen;
  
  // Hacer ajustes adicionales basados en palabras específicas
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  // Words that can easily cause confusion between products
  const keyProductWords = ['completo', 'italiano', 'churrasco', 'hamburgesa', 'papas', 'pizza'];
  
  // Check if both strings contain different key product words
  // If so, reduce similarity to avoid confusion between product categories
  const keyWords1 = words1.filter(w => keyProductWords.includes(w));
  const keyWords2 = words2.filter(w => keyProductWords.includes(w));
  
  if (keyWords1.length > 0 && keyWords2.length > 0) {
    const differentKeyWords = keyWords1.some(w => !keyWords2.includes(w)) || 
                             keyWords2.some(w => !keyWords1.includes(w));
    
    if (differentKeyWords) {
      // Significant penalty for having different key product words
      return similarity * 0.5;
    }
  }
  
  // If both strings share the same first word and it's a key product word,
  // but the rest is different, reduce similarity
  if (words1.length > 1 && words2.length > 1 && 
      words1[0] === words2[0] && 
      keyProductWords.includes(words1[0]) &&
      words1.slice(1).join(' ') !== words2.slice(1).join(' ')) {
    // Penalty for same product type but different variety
    return similarity * 0.7;
  }
  
  // If both strings share the same modifier word (like "Italiano") 
  // but have different base products, apply big penalty
  const productModifiers = ['italiano', 'tradicional', 'especial', 'clasico', 'picante'];
  
  const hasSharedModifier = productModifiers.some(mod => 
    words1.includes(mod) && words2.includes(mod) && 
    words1.filter(w => w !== mod).join('') !== words2.filter(w => w !== mod).join('')
  );
  
  if (hasSharedModifier) {
    // Heavy penalty for sharing modifiers but being different products
    // e.g. "Completo Italiano" vs "Churrasco Italiano"
    return similarity * 0.4;
  }
  
  // Final adjustment for short words
  if (s1.length < 5 || s2.length < 5) {
    return similarity * 0.6; // Be more strict with short words
  }
  
  return similarity;
}

/**
 * Función para encontrar la mejor coincidencia de producto basada en el nombre
 * Recibe el nombre buscado y una lista de productos
 * Retorna el producto que mejor coincide, o null si no hay buena coincidencia
 */
export function findBestProductMatch(searchName: string, products: any[]): any | null {
  if (!searchName || !products || products.length === 0) return null;
  
  // Increase the similarity threshold to require more exact matches
  // Higher value = stricter matching requirements
  const EXACT_MATCH_THRESHOLD = 0.95; // Almost exact match
  const SIMILARITY_THRESHOLD = 0.8;   // Very close match
  
  // Normalize the search term
  const normalizedSearchName = searchName.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  
  console.log("Finding best match for:", normalizedSearchName);
  
  // First pass: Look for exact matches after normalization
  const exactMatches: {product: any, similarity: number}[] = [];
  
  for (const product of products) {
    if (!product.name) continue;
    
    const normalizedProductName = product.name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    
    // If we find an exact match, prioritize it immediately
    if (normalizedProductName === normalizedSearchName) {
      console.log(`Exact match found for "${searchName}": "${product.name}"`);
      return product; // Return immediately for exact matches
    }
    
    // Check for very high similarity (almost exact)
    const similarity = calculateStringSimilarity(searchName, product.name);
    if (similarity >= EXACT_MATCH_THRESHOLD) {
      exactMatches.push({product, similarity});
    }
  }
  
  // If we found any exact/very close matches, return the best one
  if (exactMatches.length > 0) {
    exactMatches.sort((a, b) => b.similarity - a.similarity);
    console.log(`Found ${exactMatches.length} very close matches. Best: "${exactMatches[0].product.name}" (similarity: ${exactMatches[0].similarity.toFixed(2)})`);
    return exactMatches[0].product;
  }
  
  // Second pass: Look for good partial matches if no exact match was found
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (const product of products) {
    if (!product.name) continue;
    
    const similarity = calculateStringSimilarity(searchName, product.name);
    
    // Log all potential matches for debugging
    if (similarity > 0.5) {
      console.log(`Potential match: "${product.name}" (similarity: ${similarity.toFixed(2)})`);
    }
    
    // Update best match
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = product;
    }
  }
  
  // Only return the best match if it's above the threshold
  if (highestSimilarity >= SIMILARITY_THRESHOLD) {
    console.log(`Best match for "${searchName}": "${bestMatch.name}" (similarity: ${highestSimilarity.toFixed(2)})`);
    return bestMatch;
  }
  
  console.log(`No good match found for "${searchName}" (best similarity: ${highestSimilarity.toFixed(2)})`);
  return null;
}
