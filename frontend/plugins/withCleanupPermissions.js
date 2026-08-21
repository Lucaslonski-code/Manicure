const { withFinalizedMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function removeSystemAlertWindow(config) {
  return withFinalizedMod(config, [
    'android',
    (config) => {
      const manifestPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/AndroidManifest.xml');
      
      if (!fs.existsSync(manifestPath)) {
        return config;
      }

      let manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      
      // Remove SYSTEM_ALERT_WINDOW permission
      manifestContent = manifestContent.replace(
        /\s*<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"\/>/g,
        ''
      );

      // Disable backup
      manifestContent = manifestContent.replace(
        /android:allowBackup="true"/g,
        'android:allowBackup="false"'
      );

      fs.writeFileSync(manifestPath, manifestContent);
      return config;
    },
  ]);
}

module.exports = function withCleanupPermissions(config) {
  return removeSystemAlertWindow(config);
};
