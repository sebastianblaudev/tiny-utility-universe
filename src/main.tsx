
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth } from './lib/auth.ts'
import { initDB } from './lib/db' // Import the initDB function
import { toast } from 'sonner'

// Function to log initialization steps
const logInit = (message: string) => {
  console.log(message);
};

// Render the application immediately without waiting for initialization
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Initialize everything in the background without blocking the UI
const initializeApp = async () => {
  try {
    // First initialize the database
    logInit('Initializing database...');
    const db = await initDB();
    logInit('Database initialized successfully');

    // Initialize authentication
    logInit('Initializing authentication...');
    const auth = Auth.getInstance();

    // Create admin user if it doesn't exist (non-blocking)
    setTimeout(async () => {
      try {
        const users = auth.getAllUsers();
        if (!users.some(user => user.username === 'admin')) {
          await auth.register('admin', '1234');
          logInit('Admin user created successfully');
        }
      } catch (error) {
        console.error('Error creating admin user:', error);
      }
    }, 0);

    // Initialize backup system after a short delay to prioritize UI responsiveness
    setTimeout(() => {
      logInit('Initializing backup system...');
      import('./utils/autoBackup.ts')
        .then(module => {
          module.initializeBackupSystem();
          logInit('Backup system initialized successfully');
        })
        .catch(error => {
          console.error('Error initializing backup system:', error);
        });
    }, 500);
  } catch (error) {
    console.error('Error initializing application:', error);
    // Show error message to user
    toast.error('Error al iniciar la aplicación', {
      description: 'Por favor recarga la página para intentar nuevamente.'
    });
  }
};

// Start the application initialization in the background
initializeApp();
