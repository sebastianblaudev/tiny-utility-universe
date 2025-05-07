import { Auth } from "@/lib/auth";
import { GOOGLE_API_CREDENTIALS } from './googleApiCredentials';

// Obtener credenciales de la constante centralizada
const CLIENT_ID = GOOGLE_API_CREDENTIALS.CLIENT_ID;
const API_KEY = GOOGLE_API_CREDENTIALS.API_KEY;
const DISCOVERY_DOCS = GOOGLE_API_CREDENTIALS.DISCOVERY_DOCS;
const SCOPES = GOOGLE_API_CREDENTIALS.SCOPES;

// Variable para rastrear el estado de inicialización
let isInitialized = false;
let isAuthorized = false;

/**
 * Inicializa la API de Google Drive
 */
export const initializeGoogleDriveAPI = async (): Promise<boolean> => {
  if (isInitialized) return true;
  
  try {
    // Cargar el cliente de Google API si no está ya cargado
    if (!window.gapi) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    }
    
    // Cargar el cliente de autenticación de Google si no está ya cargado
    if (!window.gapi?.client) {
      await new Promise<void>((resolve) => {
        window.gapi.load("client:auth2", () => resolve());
      });
    }
    
    // Inicializar el cliente de Google API
    await window.gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });
    
    // Comprobar si el usuario ya está autenticado
    isAuthorized = window.gapi.auth2.getAuthInstance().isSignedIn.get();
    isInitialized = true;
    
    return true;
  } catch (error) {
    console.error("Error al inicializar la API de Google Drive:", error);
    return false;
  }
};

/**
 * Inicia sesión en Google Drive
 */
export const signInToGoogleDrive = async (): Promise<boolean> => {
  if (!isInitialized) {
    const initialized = await initializeGoogleDriveAPI();
    if (!initialized) return false;
  }
  
  try {
    await window.gapi.auth2.getAuthInstance().signIn();
    isAuthorized = window.gapi.auth2.getAuthInstance().isSignedIn.get();
    return isAuthorized;
  } catch (error) {
    console.error("Error al iniciar sesión en Google Drive:", error);
    return false;
  }
};

/**
 * Cierra sesión en Google Drive
 */
export const signOutFromGoogleDrive = async (): Promise<void> => {
  if (!isInitialized) return;
  
  try {
    await window.gapi.auth2.getAuthInstance().signOut();
    isAuthorized = false;
  } catch (error) {
    console.error("Error al cerrar sesión en Google Drive:", error);
  }
};

/**
 * Comprueba si el usuario ha iniciado sesión en Google Drive
 */
export const isSignedInToGoogleDrive = (): boolean => {
  return isAuthorized;
};

/**
 * Sube un archivo JSON a Google Drive
 * @param data Datos a subir
 * @param filename Nombre del archivo
 * @param folderId ID de la carpeta en Google Drive (opcional)
 */
export const uploadToDrive = async (
  data: any,
  filename: string,
  folderId?: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> => {
  if (!isAuthorized) {
    const signedIn = await signInToGoogleDrive();
    if (!signedIn) {
      return {
        success: false,
        error: "No se ha iniciado sesión en Google Drive",
      };
    }
  }
  
  try {
    // Convertir datos a JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    
    // Preparar metadatos del archivo
    const metadata = {
      name: filename,
      mimeType: "application/json",
    };
    
    // Si se proporciona un ID de carpeta, configurarlo como padre
    if (folderId) {
      Object.assign(metadata, {
        parents: [folderId],
      });
    }
    
    // Crear el archivo en Google Drive
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", blob);
    
    // ID del token de autorización
    const accessToken = window.gapi.auth.getToken().access_token;
    
    // Hacer solicitud a la API de Google Drive
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Error al subir archivo: ${response.status} ${errorText}`,
      };
    }
    
    const result = await response.json();
    
    return {
      success: true,
      fileId: result.id,
      webViewLink: result.webViewLink,
    };
  } catch (error) {
    console.error("Error al subir archivo a Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Crea una carpeta en Google Drive
 * @param folderName Nombre de la carpeta
 */
export const createDriveFolder = async (
  folderName: string
): Promise<{ success: boolean; folderId?: string; error?: string }> => {
  if (!isAuthorized) {
    const signedIn = await signInToGoogleDrive();
    if (!signedIn) {
      return {
        success: false,
        error: "No se ha iniciado sesión en Google Drive",
      };
    }
  }
  
  try {
    // Metadatos para la carpeta
    const metadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };
    
    // Crear la carpeta
    const response = await window.gapi.client.drive.files.create({
      resource: metadata,
      fields: "id",
    });
    
    return {
      success: true,
      folderId: response.result.id,
    };
  } catch (error) {
    console.error("Error al crear carpeta en Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Obtiene la carpeta de respaldos del usuario, o la crea si no existe
 * @param businessName Nombre del negocio para nombrar la carpeta
 */
export const getOrCreateBackupFolder = async (
  businessName: string
): Promise<{ success: boolean; folderId?: string; error?: string }> => {
  if (!isAuthorized) {
    const signedIn = await signInToGoogleDrive();
    if (!signedIn) {
      return {
        success: false,
        error: "No se ha iniciado sesión en Google Drive",
      };
    }
  }
  
  try {
    // Buscar la carpeta existente
    const folderName = `PizzaPOS-Backups-${businessName}`;
    
    const response = await window.gapi.client.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: "drive",
      fields: "files(id, name)",
    });
    
    // Si la carpeta ya existe, devolver su ID
    if (response.result.files && response.result.files.length > 0) {
      return {
        success: true,
        folderId: response.result.files[0].id,
      };
    }
    
    // Si no existe, crear una nueva carpeta
    return await createDriveFolder(folderName);
  } catch (error) {
    console.error("Error al obtener/crear carpeta de respaldos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Descarga un archivo de Google Drive
 * @param fileId ID del archivo en Google Drive
 */
export const downloadFromDrive = async (
  fileId: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  if (!isAuthorized) {
    const signedIn = await signInToGoogleDrive();
    if (!signedIn) {
      return {
        success: false,
        error: "No se ha iniciado sesión en Google Drive",
      };
    }
  }
  
  try {
    // Obtener el archivo
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: "media",
    });
    
    // Parsear la respuesta como JSON
    const data = JSON.parse(response.body);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error al descargar archivo de Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Lista los respaldos de un usuario en Google Drive
 */
export const listDriveBackups = async (): Promise<
  { success: boolean; files?: Array<{ id: string; name: string; modifiedTime: string }>; error?: string }
> => {
  if (!isAuthorized) {
    const signedIn = await signInToGoogleDrive();
    if (!signedIn) {
      return {
        success: false,
        error: "No se ha iniciado sesión en Google Drive",
      };
    }
  }
  
  try {
    // Buscar archivos JSON en Google Drive
    const response = await window.gapi.client.drive.files.list({
      q: "mimeType='application/json' and name contains 'pizzapos-backup' and trashed=false",
      spaces: "drive",
      fields: "files(id, name, modifiedTime, webViewLink)",
      orderBy: "modifiedTime desc",
    });
    
    if (response.result.files && response.result.files.length > 0) {
      return {
        success: true,
        files: response.result.files,
      };
    } else {
      return {
        success: true,
        files: [],
      };
    }
  } catch (error) {
    console.error("Error al listar respaldos de Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Guarda un backup en Google Drive
 * @param data Datos del respaldo
 */
export const saveBackupToDrive = async (data: any): Promise<{
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}> => {
  const auth = Auth.getInstance();
  if (!auth.isAuthenticated()) {
    return {
      success: false,
      error: "Debes iniciar sesión para crear un respaldo",
    };
  }
  
  const businessName = localStorage.getItem("businessName") || "PizzaPOS";
  const userId = auth.currentUser?.id || "anonymous";
  
  // Obtener/crear carpeta de respaldos
  const folderResult = await getOrCreateBackupFolder(businessName);
  
  if (!folderResult.success || !folderResult.folderId) {
    return {
      success: false,
      error: folderResult.error || "No se pudo crear carpeta para respaldos",
    };
  }
  
  // Añadir metadatos al respaldo
  const backupData = {
    ...data,
    backup_metadata: {
      businessName,
      userId,
      timestamp: new Date().toISOString(),
    },
  };
  
  // Crear nombre para el archivo
  const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
  const filename = `pizzapos-backup-${businessName.replace(/\s+/g, "-")}-${timestamp}.json`;
  
  // Subir el respaldo
  return await uploadToDrive(backupData, filename, folderResult.folderId);
};

// Tipos para manejar el proceso de restauración desde Google Drive
export interface BackupData {
  products: any[];
  customers: any[];
  orders: any[];
  tables: any[];
  business?: any;
  timestamp: string;
  backup_metadata?: {
    businessName: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Utilidad para extraer datos de respaldo de un archivo de Google Drive
 */
export const fetchBackupFromDrive = async (fileId: string): Promise<BackupData | null> => {
  const result = await downloadFromDrive(fileId);
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data as BackupData;
};
