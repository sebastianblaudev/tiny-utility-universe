
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run shell commands
function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// Create a temporary package.json for electron-builder
function createTempPackageJson() {
  const originalPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Backup original package.json
  fs.writeFileSync('package.json.backup', JSON.stringify(originalPkg, null, 2));
  console.log('Backed up original package.json to package.json.backup');
  
  // Make sure electron is in devDependencies, not dependencies
  const electronVersion = originalPkg.dependencies?.electron || 
                          originalPkg.devDependencies?.electron || 
                          "^35.1.4";
  
  // Remove electron from dependencies if it exists
  const dependencies = { 
    ...Object.fromEntries(
      Object.entries(originalPkg.dependencies || {})
        .filter(([key]) => key !== 'electron')
    )
  };
  
  // Ensure devDependencies has electron
  const devDependencies = {
    ...originalPkg.devDependencies || {},
    "electron": electronVersion
  };
  
  // Fix missing fields required by electron-builder
  const electronPkg = {
    ...originalPkg,
    main: "electron/main.js",
    type: "commonjs", // Temporarily change the type for electron-builder
    description: originalPkg.description || "Sistema POS para barberías",
    author: originalPkg.author || {
      name: "BarberPOS",
      email: "contact@barberpos.com"
    },
    scripts: {
      ...originalPkg.scripts,
      "electron:dev": "concurrently \"vite\" \"electron electron/main.js\"",
      "electron:build": "vite build && electron-builder --config electron-builder.json"
    },
    dependencies: dependencies,
    devDependencies: devDependencies
  };
  
  // Write modified package.json in place of the original
  fs.writeFileSync('package.json', JSON.stringify(electronPkg, null, 2));
  console.log('Created temporary package.json with required fields');
}

// Create a temporary postcss.config.cjs file that will work in CommonJS mode
function createTempPostcssConfig() {
  // Check if a backup already exists, don't overwrite it
  if (!fs.existsSync('postcss.config.cjs.backup') && fs.existsSync('postcss.config.js')) {
    fs.copyFileSync('postcss.config.js', 'postcss.config.cjs.backup');
    console.log('Backed up original postcss config to postcss.config.cjs.backup');
  }
  
  // Write a CommonJS-compatible PostCSS config
  const postcssConfig = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
  
  fs.writeFileSync('postcss.config.cjs', postcssConfig);
  console.log('Created temporary postcss.config.cjs with CommonJS syntax');
}

// Restore the original package.json
function restoreOriginalPackageJson() {
  if (fs.existsSync('package.json.backup')) {
    fs.copyFileSync('package.json.backup', 'package.json');
    fs.unlinkSync('package.json.backup');
    console.log('Restored original package.json');
  }
}

// Cleanup temporary files
function cleanupTempFiles() {
  if (fs.existsSync('postcss.config.cjs')) {
    fs.unlinkSync('postcss.config.cjs');
    console.log('Removed temporary postcss.config.cjs');
  }
}

// Main build process
async function build() {
  console.log('Starting Electron build process...');
  
  // Create directories if they don't exist
  if (!fs.existsSync('electron')) {
    fs.mkdirSync('electron');
  }
  
  try {
    // Create temp package.json for electron-builder
    createTempPackageJson();
    
    // Create temporary PostCSS config
    createTempPostcssConfig();
    
    // Build the React app with production mode explicitly set
    console.log('Building React app...');
    runCommand('npm run build -- --mode production');
    
    // Run electron-builder
    console.log('Building Electron app...');
    runCommand('npx electron-builder --config electron-builder.json --dir --publish never');
    
    console.log('Build complete! Check the release folder for your executable.');
  } catch (error) {
    console.error('Build failed:', error);
  } finally {
    // Always restore the original package.json
    restoreOriginalPackageJson();
    
    // Cleanup temporary files
    cleanupTempFiles();
  }
}

// Run the build process
build().catch(error => {
  console.error(error);
  restoreOriginalPackageJson(); // Make sure we restore original package.json even if script fails
  cleanupTempFiles(); // Make sure we clean up temporary files even if script fails
});

