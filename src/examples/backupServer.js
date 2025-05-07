
/**
 * Este es un ejemplo de cómo podría implementarse un servidor para recibir respaldos
 * Este código debe adaptarse y desplegarse en su propio servidor
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// Directorio donde se guardarán los respaldos
const BACKUPS_DIR = path.join(__dirname, 'backups');

// Asegurarse de que el directorio existe
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentar límite para archivos grandes

// Endpoint para recibir respaldos
app.post('/api/backups', (req, res) => {
  try {
    const backupData = req.body;
    
    // Verificar que los datos son válidos
    if (!backupData || !backupData.businessId || !backupData.timestamp) {
      return res.status(400).json({ error: 'Datos de respaldo inválidos' });
    }
    
    // Crear carpeta para el negocio si no existe
    const businessDir = path.join(BACKUPS_DIR, backupData.businessId);
    if (!fs.existsSync(businessDir)) {
      fs.mkdirSync(businessDir, { recursive: true });
    }
    
    // Formatear timestamp para el nombre del archivo
    const timestamp = backupData.timestamp.replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filePath = path.join(businessDir, filename);
    
    // Guardar archivo
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    
    console.log(`Respaldo guardado: ${filePath}`);
    
    // Registrar los metadatos del respaldo en un archivo de índice
    const indexPath = path.join(businessDir, 'index.json');
    let index = [];
    
    if (fs.existsSync(indexPath)) {
      try {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      } catch (e) {
        console.error('Error al leer el índice:', e);
      }
    }
    
    index.push({
      filename,
      timestamp: backupData.timestamp,
      size: fs.statSync(filePath).size
    });
    
    // Ordenar por fecha, más reciente primero
    index.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Guardar índice actualizado
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    
    res.status(200).json({ 
      success: true,
      message: 'Respaldo recibido y guardado correctamente',
      filename
    });
  } catch (error) {
    console.error('Error al procesar respaldo:', error);
    res.status(500).json({ 
      error: 'Error al procesar el respaldo',
      message: error.message 
    });
  }
});

// Endpoint para listar respaldos de un negocio
app.get('/api/backups/:businessId', (req, res) => {
  try {
    const { businessId } = req.params;
    const businessDir = path.join(BACKUPS_DIR, businessId);
    
    if (!fs.existsSync(businessDir)) {
      return res.status(404).json({ error: 'No se encontraron respaldos para este negocio' });
    }
    
    const indexPath = path.join(businessDir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      return res.status(200).json({ backups: [] });
    }
    
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    res.status(200).json({ backups: index });
  } catch (error) {
    console.error('Error al listar respaldos:', error);
    res.status(500).json({ error: 'Error al listar respaldos', message: error.message });
  }
});

// Endpoint para descargar un respaldo específico
app.get('/api/backups/:businessId/:filename', (req, res) => {
  try {
    const { businessId, filename } = req.params;
    const filePath = path.join(BACKUPS_DIR, businessId, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo de respaldo no encontrado' });
    }
    
    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.status(200).json(backupData);
  } catch (error) {
    console.error('Error al descargar respaldo:', error);
    res.status(500).json({ error: 'Error al descargar respaldo', message: error.message });
  }
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de respaldos ejecutándose en el puerto ${PORT}`);
});
