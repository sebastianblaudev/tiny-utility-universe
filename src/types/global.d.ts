
interface Window {
  gapi: {
    client: {
      init: (options: {
        apiKey: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }) => Promise<void>;
      drive: {
        files: {
          create: (options: any) => Promise<any>;
          get: (options: any) => Promise<any>;
          list: (options: any) => Promise<any>;
        };
      };
    };
    load: (what: string, callback: () => void) => void;
    auth: {
      getToken: () => { access_token: string };
    };
    auth2: {
      getAuthInstance: () => {
        isSignedIn: {
          get: () => boolean;
        };
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
      };
    };
  };
}
