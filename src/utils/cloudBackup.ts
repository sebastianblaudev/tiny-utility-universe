
/**
 * Utilidades para el respaldo en la nube usando Google Cloud Storage
 */

// Variables de control
let isInitialized = false;
let isAuthorized = false;

/**
 * Inicializa la API de Google Cloud
 */
export const initializeCloudAPI = async (): Promise<boolean> => {
  // Delegamos la inicialización a Google Drive
  const { initializeGoogleDriveAPI } = await import('./googleDriveBackup');
  const result = await initializeGoogleDriveAPI();
  isInitialized = result;
  return result;
};

/**
 * Inicia sesión en Google Cloud
 */
export const signInToCloud = async (): Promise<boolean> => {
  try {
    const { signInToGoogleDrive } = await import('./googleDriveBackup');
    const result = await signInToGoogleDrive();
    isAuthorized = result;
    return result;
  } catch (error) {
    console.error('Error signing in to Google Cloud:', error);
    return false;
  }
};

/**
 * Cierra sesión en Google Cloud
 */
export const signOutFromCloud = async (): Promise<void> => {
  try {
    const { signOutFromGoogleDrive } = await import('./googleDriveBackup');
    await signOutFromGoogleDrive();
    isAuthorized = false;
  } catch (error) {
    console.error('Error signing out from Google Cloud:', error);
  }
};

/**
 * Verifica si el usuario ha iniciado sesión en Google Cloud
 */
export const isSignedInToCloud = (): boolean => {
  return isAuthorized;
};

/**
 * Crea un bucket en Google Cloud Storage
 * @param bucketName Nombre del bucket
 * @param projectId ID del proyecto de Google Cloud
 */
export const createCloudBucket = async (bucketName: string, projectId: string): Promise<string | null> => {
  try {
    const { getOrCreateBackupFolder } = await import('./googleDriveBackup');
    // En lugar de crear un bucket GCS, creamos una carpeta en Google Drive
    const folderResult = await getOrCreateBackupFolder(bucketName);
    
    if (folderResult.success && folderResult.folderId) {
      return folderResult.folderId;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating Google Cloud bucket:', error);
    return null;
  }
};
