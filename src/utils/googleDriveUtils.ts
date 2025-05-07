
import { Auth } from "@/lib/auth";
import { GOOGLE_API_CREDENTIALS } from './googleApiCredentials';

// Estado de la API
let isInitialized = false;
let isAuthorized = false;

/**
 * Inicializa la API de Google Drive
 */
export const initializeGoogleDrive = async (): Promise<boolean> => {
  try {
    // Si ya está inicializada, retornar
    if (isInitialized) return true;
    
    // Cargar el script de la API si no está ya cargado
    if (!window.gapi) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    }
    
    // Cargar el cliente de autenticación
    await new Promise<void>((resolve) => {
      window.gapi.load("client:auth2", resolve);
    });
    
    // Inicializar el cliente
    await window.gapi.client.init({
      apiKey: GOOGLE_API_CREDENTIALS.API_KEY,
      clientId: GOOGLE_API_CREDENTIALS.CLIENT_ID,
      discoveryDocs: GOOGLE_API_CREDENTIALS.DISCOVERY_DOCS,
      scope: GOOGLE_API_CREDENTIALS.SCOPES,
    });
    
    // Verificar si ya está autenticado
    isAuthorized = window.gapi.auth2.getAuthInstance().isSignedIn.get();
    isInitialized = true;
    
    return true;
  } catch (error) {
    console.error("Error al inicializar Google Drive:", error);
    return false;
  }
};

/**
 * Inicia sesión en Google Drive
 */
export const loginToGoogleDrive = async (): Promise<boolean> => {
  try {
    // Inicializar si aún no está inicializado
    if (!isInitialized) {
      const initialized = await initializeGoogleDrive();
      if (!initialized) return false;
    }
    
    // Iniciar sesión
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
export const logoutFromGoogleDrive = async (): Promise<void> => {
  try {
    if (!isInitialized) return;
    
    await window.gapi.auth2.getAuthInstance().signOut();
    isAuthorized = false;
  } catch (error) {
    console.error("Error al cerrar sesión en Google Drive:", error);
  }
};

/**
 * Verifica si el usuario está autenticado en Google Drive
 */
export const isGoogleDriveAuthenticated = (): boolean => {
  return isAuthorized;
};

/**
 * Crea una carpeta en Google Drive
 * @param name Nombre de la carpeta
 */
export const createDriveFolder = async (
  name: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    if (!isAuthorized) {
      const loggedIn = await loginToGoogleDrive();
      if (!loggedIn) {
        return {
          success: false,
          error: "No autenticado en Google Drive",
        };
      }
    }
    
    const response = await window.gapi.client.drive.files.create({
      resource: {
        name,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    
    return {
      success: true,
      id: response.result.id,
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
 * Busca una carpeta por nombre en Google Drive
 * @param name Nombre de la carpeta
 */
export const findDriveFolder = async (
  name: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    if (!isAuthorized) {
      const loggedIn = await loginToGoogleDrive();
      if (!loggedIn) {
        return {
          success: false,
          error: "No autenticado en Google Drive",
        };
      }
    }
    
    const response = await window.gapi.client.drive.files.list({
      q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: "drive",
      fields: "files(id, name)",
    });
    
    if (response.result.files && response.result.files.length > 0) {
      return {
        success: true,
        id: response.result.files[0].id,
      };
    }
    
    return {
      success: false,
      error: "Carpeta no encontrada",
    };
  } catch (error) {
    console.error("Error al buscar carpeta en Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Obtiene o crea una carpeta para respaldos
 * @param businessName Nombre del negocio
 */
export const getOrCreateBackupFolder = async (
  businessName: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    // Crear un nombre de carpeta con el nombre del negocio
    const folderName = `PizzaPOS-Backups-${businessName.replace(/\s+/g, "-")}`;
    
    // Buscar la carpeta primero
    const findResult = await findDriveFolder(folderName);
    
    // Si la carpeta existe, retornar su ID
    if (findResult.success && findResult.id) {
      return findResult;
    }
    
    // Si no existe, crearla
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
 * Sube un archivo a Google Drive
 * @param data Datos a subir
 * @param filename Nombre del archivo
 * @param folderId ID de la carpeta donde guardar
 */
export const uploadToDrive = async (
  data: any,
  filename: string,
  folderId?: string
): Promise<{ success: boolean; id?: string; link?: string; error?: string }> => {
  try {
    if (!isAuthorized) {
      const loggedIn = await loginToGoogleDrive();
      if (!loggedIn) {
        return {
          success: false,
          error: "No autenticado en Google Drive",
        };
      }
    }
    
    // Crear el blob con los datos JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    
    // Metadata del archivo
    const metadata: any = {
      name: filename,
      mimeType: "application/json",
    };
    
    // Si hay un ID de carpeta, establecer como parent
    if (folderId) {
      metadata.parents = [folderId];
    }
    
    // Preparar form data para la subida
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", blob);
    
    // Obtener el token de acceso
    const accessToken = window.gapi.auth.getToken().access_token;
    
    // Hacer la petición directamente con fetch para tener más control
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
        error: `Error al subir: ${response.status} ${errorText}`,
      };
    }
    
    const result = await response.json();
    
    return {
      success: true,
      id: result.id,
      link: result.webViewLink,
    };
  } catch (error) {
    console.error("Error al subir a Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Guarda un respaldo en Google Drive
 * @param data Datos del respaldo
 */
export const saveBackupToDrive = async (
  data: any
): Promise<{ success: boolean; id?: string; link?: string; error?: string }> => {
  try {
    // Verificar autenticación
    const auth = Auth.getInstance();
    if (!auth.isAuthenticated() || !auth.currentUser?.id) {
      return {
        success: false,
        error: "No has iniciado sesión",
      };
    }
    
    // Obtener nombre del negocio
    let businessName = "PizzaPOS";
    try {
      if (data.business?.name) {
        businessName = data.business.name;
      } else if (localStorage.getItem("businessName")) {
        businessName = localStorage.getItem("businessName") as string;
      }
    } catch (e) {
      console.error("Error al obtener nombre del negocio:", e);
    }
    
    // Obtener/crear carpeta para respaldos
    const folderResult = await getOrCreateBackupFolder(businessName);
    if (!folderResult.success || !folderResult.id) {
      return {
        success: false,
        error: folderResult.error || "No se pudo crear carpeta de respaldos",
      };
    }
    
    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
    const filename = `pizzapos-backup-${businessName.replace(/\s+/g, "-")}-${timestamp}.json`;
    
    // Añadir metadatos
    const backupWithMetadata = {
      ...data,
      backup_metadata: {
        businessName,
        userId: auth.currentUser.id,
        timestamp: new Date().toISOString(),
      },
    };
    
    // Subir a Google Drive
    return await uploadToDrive(backupWithMetadata, filename, folderResult.id);
  } catch (error) {
    console.error("Error al guardar respaldo en Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Obtiene la lista de respaldos disponibles
 */
export const listDriveBackups = async (): Promise<{
  success: boolean;
  backups?: Array<{ id: string; name: string; modifiedTime: string; link?: string }>;
  error?: string;
}> => {
  try {
    if (!isAuthorized) {
      const loggedIn = await loginToGoogleDrive();
      if (!loggedIn) {
        return {
          success: false,
          error: "No autenticado en Google Drive",
        };
      }
    }
    
    const response = await window.gapi.client.drive.files.list({
      q: "mimeType='application/json' and name contains 'pizzapos-backup' and trashed=false",
      spaces: "drive",
      fields: "files(id, name, modifiedTime, webViewLink)",
      orderBy: "modifiedTime desc",
    });
    
    if (response.result.files && response.result.files.length > 0) {
      return {
        success: true,
        backups: response.result.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          modifiedTime: file.modifiedTime,
          link: file.webViewLink,
        })),
      };
    } else {
      return {
        success: true,
        backups: [],
      };
    }
  } catch (error) {
    console.error("Error al listar respaldos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

/**
 * Descarga un respaldo de Google Drive
 * @param fileId ID del archivo en Google Drive
 */
export const downloadDriveBackup = async (
  fileId: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (!isAuthorized) {
      const loggedIn = await loginToGoogleDrive();
      if (!loggedIn) {
        return {
          success: false,
          error: "No autenticado en Google Drive",
        };
      }
    }
    
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: "media",
    });
    
    return {
      success: true,
      data: JSON.parse(response.body),
    };
  } catch (error) {
    console.error("Error al descargar respaldo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

// Nota: Los tipos de la API de Google ya están definidos en vite-env.d.ts
