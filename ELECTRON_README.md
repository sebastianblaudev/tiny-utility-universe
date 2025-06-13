
# Building BarberPOS as an Executable

This project can be built as a standalone executable application using Electron.

## Development Mode

To run the application in development mode with Electron:

```bash
# First terminal: Start the Vite dev server
npm run dev

# Second terminal: Start Electron pointing to the dev server
node -e "require('electron')('electron/main.js')"
```

## Building the Executable

To build the executable (.exe for Windows):

```bash
# Run the build script
node build-electron.js
```

This will:
1. Build the React application
2. Package it with Electron
3. Create installers in the `release` folder

## Manual Build Steps

If you prefer to run the steps manually:

```bash
# Build the React app
npm run build

# Build the Electron app
npx electron-builder --config electron-builder.json
```

## Configuration

- The Electron configuration is in `electron-builder.json`
- Main Electron process code is in `electron/main.js`
- Preload script is in `electron/preload.js`

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed
2. Check that the build process completed successfully
3. Look for errors in the console output
4. Verify that the `dist` folder contains the built React application
```
