
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth } from './lib/auth.ts'
import { initializeBackupSystem } from './utils/autoBackup.ts'

// Initialize authentication
const auth = Auth.getInstance();

// Create admin user if it doesn't exist
const initializeAdmin = async () => {
  try {
    const users = await auth.getAllUsers();
    if (!users.some(user => user.username === 'admin')) {
      await auth.register('admin', '1234');
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

initializeAdmin();

// Initialize backup system
initializeBackupSystem();

createRoot(document.getElementById("root")!).render(<App />);
