
import { checkBusinessLicense } from "./license";

interface User {
  username: string;
  id: string;
  role?: "admin" | "cashier";
  pin?: string;
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

  public async register(username: string, password: string, role: "admin" | "cashier" = "admin"): Promise<User> {
    if (!username || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    
    const existingUsers = this.getAllUsers();
    if (existingUsers.find(u => u.username === username)) {
      throw new Error('Este usuario ya está registrado');
    }
    
    const userId = crypto.randomUUID();
    const newUser: User = { username, id: userId, role };
    
    const hashedPassword = await this.hashPassword(password);
    const users = existingUsers;
    users.push({
      username,
      id: userId,
      passwordHash: hashedPassword,
      role,
      pin: role === "admin" ? this.generateInitialPin() : undefined
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
    
    // First check the business license
    const licenseStatus = await checkBusinessLicense(username);
    
    if (!licenseStatus.found) {
      throw new Error('Negocio no encontrado');
    }

    if (!licenseStatus.isValid) {
      // Si la licencia no es válida, almacenamos las credenciales temporalmente
      // para poder usarlas en la página de activación
      const users = this.getAllUsers();
      const user = users.find(u => u.username === username);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
      }

      // Store temporary session for license activation
      const authUser: User = { 
        username, 
        id: user.id,
        role: user.role || "admin",
        pin: user.pin
      };
      this._currentUser = authUser;
      localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(authUser));
      
      throw new Error('LICENSE_EXPIRED');
    }
    
    // Continue with normal login flow if license is valid
    const users = this.getAllUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta');
    }
    
    const authUser: User = { 
      username, 
      id: user.id,
      role: user.role || "admin",
      pin: user.pin
    };
    this._currentUser = authUser;
    localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(authUser));
    
    return authUser;
  }

  public async loginWithPin(pin: string): Promise<User> {
    if (!pin || pin.length !== 4) {
      throw new Error('PIN inválido');
    }

    const users = this.getAllUsers();
    const user = users.find(u => u.pin === pin);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const authUser: User = {
      username: user.username,
      id: user.id,
      role: user.role || "cashier",
      pin: user.pin
    };

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
  
  public isAdmin(): boolean {
    return this._currentUser?.role === "admin" || this._currentUser?.role === undefined;
  }

  public isCashier(): boolean {
    return this._currentUser?.role === "cashier";
  }
  
  public getAllUsers(): Array<{username: string, id: string, passwordHash: string, role?: "admin" | "cashier", pin?: string}> {
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

  public async changePin(username: string, newPin: string): Promise<void> {
    if (!username || !newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      throw new Error('Usuario y PIN válido de 4 dígitos son requeridos');
    }
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el PIN no esté en uso
    if (users.some((u, idx) => idx !== userIndex && u.pin === newPin)) {
      throw new Error('Este PIN ya está en uso por otro usuario');
    }
    
    users[userIndex].pin = newPin;
    
    // Si el usuario actual es el que está cambiando su PIN, actualizar el currentUser
    if (this._currentUser && this._currentUser.username === username) {
      this._currentUser = {
        ...this._currentUser,
        pin: newPin
      };
      localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(this._currentUser));
    }
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
  }

  public async createCashier(username: string): Promise<User> {
    if (!username) {
      throw new Error('Nombre de usuario es requerido');
    }
    
    const existingUsers = this.getAllUsers();
    if (existingUsers.find(u => u.username === username)) {
      throw new Error('Este usuario ya está registrado');
    }
    
    const userId = crypto.randomUUID();
    const pin = this.generateInitialPin();
    
    // Verificar que el PIN no esté en uso
    let uniquePin = pin;
    while (existingUsers.some(u => u.pin === uniquePin)) {
      uniquePin = this.generateInitialPin();
    }
    
    const users = existingUsers;
    users.push({
      username,
      id: userId,
      passwordHash: "", // No se requiere contraseña para cajeros
      role: "cashier",
      pin: uniquePin
    });
    
    localStorage.setItem('pizza_pos_users', JSON.stringify(users));
    
    return { username, id: userId, role: "cashier", pin: uniquePin };
  }

  public getCashiers(): Array<{username: string, id: string, pin?: string}> {
    const users = this.getAllUsers();
    return users
      .filter(u => u.role === "cashier")
      .map(u => ({
        username: u.username,
        id: u.id,
        pin: u.pin
      }));
  }

  private generateInitialPin(): string {
    // Generar un PIN aleatorio de 4 dígitos
    let pin = '';
    for (let i = 0; i < 4; i++) {
      pin += Math.floor(Math.random() * 10).toString();
    }
    return pin;
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
