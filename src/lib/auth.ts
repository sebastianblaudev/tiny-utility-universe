interface User {
  username: string;
  id: string;
}

// Clase para manejar la autenticación
export class Auth {
  private static readonly STORAGE_KEY = 'pizza_pos_auth';
  private static instance: Auth | null = null;
  private _currentUser: User | null = null;
  
  private constructor() {
    // Intentar cargar el usuario desde localStorage al iniciar
    const savedAuth = localStorage.getItem(Auth.STORAGE_KEY);
    if (savedAuth) {
      try {
        this._currentUser = JSON.parse(savedAuth);
      } catch (e) {
        console.error('Error parsing saved auth data', e);
        localStorage.removeItem(Auth.STORAGE_KEY);
      }
    }
  }

  public static getInstance(): Auth {
    if (!Auth.instance) {
      Auth.instance = new Auth();
    }
    return Auth.instance;
  }

  public get currentUser(): User | null {
    return this._currentUser;
  }

  public async register(username: string, password: string): Promise<User> {
    if (!username || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    
    const existingUsers = this.getAllUsers();
    if (existingUsers.find(u => u.username === username)) {
      throw new Error('Este usuario ya está registrado');
    }
    
    const userId = crypto.randomUUID();
    const newUser: User = { username, id: userId };
    
    const hashedPassword = await this.hashPassword(password);
    const users = existingUsers;
    users.push({
      username,
      id: userId,
      passwordHash: hashedPassword
    });
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
    this._currentUser = newUser;
    localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(newUser));
    
    return newUser;
  }

  public async login(username: string, password: string): Promise<User> {
    if (!username || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    
    const users = this.getAllUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta');
    }
    
    const authUser: User = { username, id: user.id };
    this._currentUser = authUser;
    localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(authUser));
    
    return authUser;
  }

  public logout(): void {
    this._currentUser = null;
    localStorage.removeItem(Auth.STORAGE_KEY);
  }
  
  public isAuthenticated(): boolean {
    return this._currentUser !== null;
  }
  
  public getAllUsers(): Array<{username: string, id: string, passwordHash: string}> {
    try {
      const users = localStorage.getItem('pizza_pos_users');
      return users ? JSON.parse(users) : [];
    } catch (e) {
      console.error('Error getting users', e);
      return [];
    }
  }
  
  public async changePassword(username: string, newPassword: string): Promise<void> {
    if (!username || !newPassword) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }
    
    const hashedPassword = await this.hashPassword(newPassword);
    users[userIndex].passwordHash = hashedPassword;
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
  }
  
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }
}
