
import { gapi } from 'gapi-script';

interface CloudStorageConfig {
  enabled: boolean;
  bucketName?: string;
}

// Initialize Google Cloud API
export async function initializeCloudAPI(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: 'YOUR_PUBLIC_API_KEY', // You'll need to replace this with your GCP API key
            clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // Replace with your client ID
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/storage/v1/rest'],
            scope: 'https://www.googleapis.com/auth/devstorage.read_write'
          })
          .then(() => {
            resolve();
          })
          .catch((error) => {
            console.error('Error initializing Google Cloud API:', error);
            reject(error);
          });
      });
    });
    return true;
  } catch (err) {
    console.error('Failed to initialize Google Cloud API:', err);
    return false;
  }
}

// Sign in to Google Cloud
export async function signInToCloud(): Promise<boolean> {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
    return authInstance.isSignedIn.get();
  } catch (err) {
    console.error('Error signing in to Google Cloud:', err);
    return false;
  }
}

// Sign out from Google Cloud
export function signOutFromCloud(): void {
  const authInstance = gapi.auth2?.getAuthInstance();
  if (authInstance && authInstance.isSignedIn.get()) {
    authInstance.signOut();
  }
}

// Check if user is signed in to Google Cloud
export function isSignedInToCloud(): boolean {
  const authInstance = gapi.auth2?.getAuthInstance();
  return authInstance ? authInstance.isSignedIn.get() : false;
}

// Upload backup to Google Cloud Storage
export async function uploadBackupToCloud(
  jsonData: string,
  filename: string,
  bucketName: string = 'default-pizzapos-backups'
): Promise<string | null> {
  try {
    // Check if user is signed in
    if (!isSignedInToCloud()) {
      const signedIn = await signInToCloud();
      if (!signedIn) {
        throw new Error('User not signed in to Google Cloud');
      }
    }

    // Get access token
    const accessToken = gapi.auth.getToken().access_token;
    
    // Create a blob from the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Upload file to Google Cloud Storage using fetch API
    const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: blob
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('File uploaded successfully to Cloud Storage:', data);
    return data.id || data.name;
  } catch (err) {
    console.error('Error uploading backup to Google Cloud Storage:', err);
    return null;
  }
}

// Test Google Cloud connection
export async function testCloudConnection(): Promise<boolean> {
  try {
    // Initialize API
    await initializeCloudAPI();
    
    // Try to sign in
    const signedIn = await signInToCloud();
    
    // If sign in successful, we have a connection
    return signedIn;
  } catch (err) {
    console.error('Error testing Google Cloud connection:', err);
    return false;
  }
}

// Create bucket in Google Cloud Storage
export async function createCloudBucket(bucketName: string, projectId: string = 'your-project-id'): Promise<string | null> {
  try {
    if (!isSignedInToCloud()) {
      const signedIn = await signInToCloud();
      if (!signedIn) {
        throw new Error('User not signed in to Google Cloud');
      }
    }

    const accessToken = gapi.auth.getToken().access_token;
    
    const response = await fetch(`https://storage.googleapis.com/storage/v1/b?project=${projectId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: bucketName,
        location: 'us-central1'  // Default region
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create bucket: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id || data.name;
  } catch (err) {
    console.error('Error creating Google Cloud Storage bucket:', err);
    return null;
  }
}
