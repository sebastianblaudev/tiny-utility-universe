
import { supabase } from '@/integrations/supabase/client';

export class SupabaseBackupService {
  async checkBackupExists(): Promise<boolean> {
    try {
      const { data } = await supabase.storage
        .from('backups')
        .list('', { limit: 1 });
      return !!data && data.length > 0;
    } catch (error) {
      console.error('Error checking backup:', error);
      return false;
    }
  }

  async getBackupInfo(): Promise<{ fileName: string; lastModified: string } | null> {
    try {
      const { data } = await supabase.storage
        .from('backups')
        .list('', { limit: 1, sortBy: { column: 'updated_at', order: 'desc' } });
      
      if (data && data.length > 0) {
        return {
          fileName: data[0].name,
          lastModified: data[0].updated_at || new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting backup info:', error);
      return null;
    }
  }

  async createBackup(backupData: any): Promise<void> {
    try {
      const fileName = `backup_${Date.now()}.json`;
      const fileContent = JSON.stringify(backupData, null, 2);
      
      const { error } = await supabase.storage
        .from('backups')
        .upload(fileName, fileContent, {
          contentType: 'application/json',
          upsert: true
        });

      if (error) throw error;
      console.log('Backup created successfully:', fileName);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async loadBackup(): Promise<any | null> {
    try {
      const { data: files } = await supabase.storage
        .from('backups')
        .list('', { limit: 1, sortBy: { column: 'updated_at', order: 'desc' } });

      if (!files || files.length === 0) {
        return null;
      }

      const { data } = await supabase.storage
        .from('backups')
        .download(files[0].name);

      if (!data) return null;

      const text = await data.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Error loading backup:', error);
      return null;
    }
  }

  // Compatibility methods for existing code
  async restoreFromSupabase(): Promise<any | null> {
    return this.loadBackup();
  }

  async createBackupToSupabase(data: any): Promise<void> {
    return this.createBackup(data);
  }
}
