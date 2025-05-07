
/// <reference types="vite/client" />

// Definiciones para Google API Client
interface GoogleApiAuth {
  getToken(): { access_token: string };
}

interface GoogleAuth2Instance {
  isSignedIn: {
    get(): boolean;
    listen(callback: (isSignedIn: boolean) => void): void;
  };
  signIn(): Promise<any>;
  signOut(): Promise<any>;
  currentUser: {
    get(): any;
  };
}

interface GoogleApiClient {
  init(options: {
    apiKey: string;
    clientId: string;
    discoveryDocs: string[];
    scope: string;
  }): Promise<void>;
  drive: {
    files: {
      create(options: any): Promise<any>;
      list(options: any): Promise<any>;
      get(options: any): Promise<any>;
    };
  };
}

interface GoogleApi {
  load(api: string, callback: () => void): void;
  auth: GoogleApiAuth;
  auth2: {
    getAuthInstance(): GoogleAuth2Instance;
  };
  client: GoogleApiClient;
}

interface Window {
  gapi: GoogleApi;
}
