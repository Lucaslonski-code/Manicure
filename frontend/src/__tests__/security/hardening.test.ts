const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..', '..', '..');
const supabaseConfigPath = path.join(projectRoot, 'supabase', 'config.toml');
const frontendDir = path.resolve(__dirname, '../..', '..');

describe('Security Hardening Tests', () => {
  describe('Frontend Environment', () => {
    it('should not expose service_role in frontend code', () => {
      const files = [
        'src/services/api.ts',
        'src/services/notifications/notifications.ts',
        'src/hooks/useAuth.ts',
        'src/hooks/useNotifications.ts',
      ];
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(frontendDir, file), 'utf-8');
        expect(content).not.toMatch(/service_role/);
        expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
        expect(content).not.toMatch(/sb_secret_/);
      }
    });

    it('should not store passwords in local storage', () => {
      const files = [
        'src/services/api.ts',
        'src/services/auth/authService.ts',
        'src/hooks/useAuth.ts',
      ];
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(frontendDir, file), 'utf-8');
        expect(content).not.toMatch(/password.*localStorage/);
        expect(content).not.toMatch(/password.*AsyncStorage/);
        expect(content).not.toMatch(/password.*secureStore/);
      }
    });
  });

  describe('Edge Function Security', () => {
    it('send-push-notification should require JWT in config', () => {
      const content = fs.readFileSync(supabaseConfigPath, 'utf-8');
      const match = content.match(/\[functions\.send-push-notification\]([\s\S]*?)(?=\n\[|\Z)/);
      expect(match).toBeTruthy();
      expect(match![0]).toMatch(/verify_jwt = true/);
    });

    it('delete-account-external should have rate limiting', () => {
      const content = fs.readFileSync(
        path.join(projectRoot, 'supabase/functions/delete-account-external/index.ts'),
        'utf-8'
      );
      expect(content).toMatch(/check_rate_limit/);
      expect(content).toMatch(/rate_limits/);
    });
  });

  describe('Android Security', () => {
    it('should not have SYSTEM_ALERT_WINDOW permission', () => {
      const manifestPath = path.join(frontendDir, 'android/app/src/main/AndroidManifest.xml');
      
      if (fs.existsSync(manifestPath)) {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        expect(content).not.toMatch(/SYSTEM_ALERT_WINDOW/);
        expect(content).toMatch(/allowBackup="false"/);
      }
    });
  });

  describe('Auth Configuration', () => {
    it('should require email confirmation', () => {
      const content = fs.readFileSync(supabaseConfigPath, 'utf-8');
      expect(content).toMatch(/enable_confirmations = true/);
    });

    it('should require secure password change', () => {
      const content = fs.readFileSync(supabaseConfigPath, 'utf-8');
      expect(content).toMatch(/secure_password_change = true/);
    });

    it('should enforce strong password policy', () => {
      const content = fs.readFileSync(supabaseConfigPath, 'utf-8');
      expect(content).toMatch(/minimum_password_length = 8/);
      expect(content).toMatch(/lower_upper_letters_digits_symbols/);
    });
  });

  describe('Migrations', () => {
    it('should have trigger functions with SECURITY DEFINER', () => {
      const migrations = [
        '0009_fix_trigger_security.sql',
        '0010_fix_delete_account.sql',
        '0011_security_hardening.sql',
      ];
      
      for (const migration of migrations) {
        const content = fs.readFileSync(
          path.join(projectRoot, `supabase/migrations/${migration}`),
          'utf-8'
        );
        expect(content).toMatch(/SECURITY DEFINER/);
        expect(content).toMatch(/SET search_path = public, pg_temp/);
      }
    });
  });
});
