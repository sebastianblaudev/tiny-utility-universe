
/**
 * This utility is used to register operations that need to be synchronized with the server
 */

// Function to register an operation for synchronization
export const registerOperation = (type: string, details: any) => {
  try {
    // Get existing operations from localStorage
    const storedOperations = localStorage.getItem('pendingOperations');
    let operations = storedOperations ? JSON.parse(storedOperations) : [];
    
    // Add the new operation with timestamp
    operations.push({
      type,
      details,
      timestamp: new Date().toISOString()
    });
    
    // Store back to localStorage
    localStorage.setItem('pendingOperations', JSON.stringify(operations));
    
    // Trigger immediate sync if enabled
    triggerSyncAfterOperation();
    
    // Dispatch custom event to notify ingredient updates
    if (type === 'inventario_actualizado') {
      const event = new Event('ingredientsUpdated');
      window.dispatchEvent(event);
    }
    
    return true;
  } catch (error) {
    console.error('Error registering operation for sync:', error);
    return false;
  }
};

// Variable to track debounce timeout
let syncTimeout: number | null = null;

// Function to trigger sync after operation with debounce
const triggerSyncAfterOperation = () => {
  // Clear any existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  // Set new timeout (debounce for 30 seconds)
  syncTimeout = window.setTimeout(() => {
    // Find and execute the sync function if available
    if (typeof window.syncBackupAfterOperation === 'function') {
      window.syncBackupAfterOperation();
    }
  }, 30000); // 30 second debounce
};

// Add to window for global access
declare global {
  interface Window {
    syncBackupAfterOperation?: () => void;
  }
}
