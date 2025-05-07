
/**
 * Utilidad para obtener respaldos de Google Drive para propósitos especiales
 * como la visualización de estadísticas o administración
 */

import type { BackupData } from "../types/backupTypes";

/**
 * Función para obtener datos de respaldo desde una URL o ID de Google Drive
 * @param urlOrId URL o ID del archivo en Google Drive
 * @returns Datos del respaldo
 */
export const fetchBackupFromDrive = async (urlOrId: string): Promise<BackupData | null> => {
  try {
    // Extraer ID del archivo si se proporciona una URL completa
    let fileId = urlOrId;
    
    // Patrones posibles para URLs de Google Drive
    const patterns = [
      /\/d\/([^/]+)/,         // Formato /d/{fileId}
      /id=([^&]+)/,           // Formato id={fileId}
      /\/file\/d\/([^/]+)\//  // Formato /file/d/{fileId}/
    ];
    
    // Intentar extraer el ID de la URL si es necesario
    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }
    
    try {
      // Importar dinámicamente para evitar conflictos de nombres
      const { downloadFromDrive } = await import('./googleDriveBackup');
      
      // Intentar obtener el respaldo utilizando la utilidad principal
      const result = await downloadFromDrive(fileId);
      if (result.success && result.data) {
        return result.data as BackupData;
      }
    } catch (error) {
      console.error("Error al obtener respaldo:", error);
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener respaldo:", error);
    return null;
  }
};
