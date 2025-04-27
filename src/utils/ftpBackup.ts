
import * as ftp from 'basic-ftp';

interface FTPConfig {
  host: string;
  user: string;
  password: string;
  path?: string;
}

export async function uploadBackupToFTP(
  jsonData: string,
  filename: string,
  config: FTPConfig
): Promise<boolean> {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  
  try {
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      secure: false
    });
    
    // Convert string to Buffer for upload
    const buffer = Buffer.from(jsonData);
    
    // Navigate to specified directory if provided
    if (config.path) {
      await client.ensureDir(config.path);
      await client.cd(config.path);
    }
    
    // Upload the file
    await client.uploadFrom(buffer, filename);
    return true;
  } catch (err) {
    console.error('Error uploading backup to FTP:', err);
    return false;
  } finally {
    client.close();
  }
}
