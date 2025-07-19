const fs = require('fs');
const path = require('path');
const os = require('os');

// ʕ •ᴥ•ʔ✿ Platform Detection & Cross-Platform Utilities ✿ ʕ •ᴥ•ʔ
class PlatformUtils {
  static isWindows() {
    return os.platform() === 'win32';
  }

  static isLinux() {
    return os.platform() === 'linux';
  }

  static isMacOS() {
    return os.platform() === 'darwin';
  }

  // ʕ ◕ᴥ◕ ʔ✿ Get appropriate config directory for platform ✿ ʕ ◕ᴥ◕ ʔ
  static getConfigDir() {
    if (this.isWindows()) {
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Synastria');
    } else if (this.isLinux()) {
      return path.join(os.homedir(), '.config', 'synastria');
    } else if (this.isMacOS()) {
      return path.join(os.homedir(), 'Library', 'Application Support', 'Synastria');
    }
    return path.join(os.homedir(), '.synastria');
  }

  // ʕ ● ᴥ ●ʔ✿ Detect available Proton-GE installations ✿ ʕ ● ᴥ ●ʔ
  static getProtonGEPaths() {
    if (!this.isLinux()) return [];

    const protonPaths = [];
    const possibleDirs = [
      path.join(os.homedir(), '.steam', 'compatibilitytools.d'),
      path.join(os.homedir(), '.local', 'share', 'Steam', 'compatibilitytools.d'),
      '/usr/share/steam/compatibilitytools.d',
      '/opt/steam/compatibilitytools.d'
    ];

    for (const dir of possibleDirs) {
      if (fs.existsSync(dir)) {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory() && entry.name.toLowerCase().includes('proton')) {
              const protonDir = path.join(dir, entry.name);
              const protonExe = path.join(protonDir, 'proton');
              if (fs.existsSync(protonExe)) {
                protonPaths.push({
                  name: entry.name,
                  path: protonDir,
                  executable: protonExe
                });
              }
            }
          }
        } catch (err) {
          // ʕノ•ᴥ•ʔノ✿ Directory not accessible, skip ✿ ʕノ•ᴥ•ʔノ
        }
      }
    }

    return protonPaths.sort((a, b) => b.name.localeCompare(a.name)); // ʕ •ᴥ•ʔ✿ Newest first ✿ ʕ •ᴥ•ʔ
  }

  // ＼ʕ •ᴥ•ʔ／✿ Get best available Proton-GE version ✿ ＼ʕ •ᴥ•ʔ／
  static getBestProtonGE() {
    const available = this.getProtonGEPaths();
    return available.length > 0 ? available[0] : null;
  }

  // ʕ ◕ᴥ◕ ʔ✿ Detect WoW executable for platform ✿ ʕ ◕ᴥ◕ ʔ
  static getWoWExecutables(clientDir) {
    const executables = [];
    
    if (this.isWindows()) {
      const wowExe = path.join(clientDir, 'wow.exe');
      const wowExtExe = path.join(clientDir, 'wowext.exe');
      
      if (fs.existsSync(wowExe)) executables.push({ name: 'wow.exe', path: wowExe, type: 'native' });
      if (fs.existsSync(wowExtExe)) executables.push({ name: 'wowext.exe', path: wowExtExe, type: 'native' });
    } else if (this.isLinux()) {
      // ʕ •ᴥ•ʔ✿ On Linux, look for Windows executables (case-insensitive) to run via Proton ✿ ʕ •ᴥ•ʔ
      try {
        const files = fs.readdirSync(clientDir);
        
        // ʕ ● ᴥ ●ʔ✿ Case-insensitive search for WoW executables ✿ ʕ ● ᴥ ●ʔ
        const wowExeVariants = ['wow.exe', 'Wow.exe', 'WoW.exe', 'WOW.exe'];
        const wowExtVariants = ['wowext.exe', 'WowExt.exe', 'WoWExt.exe', 'WOWEXT.exe'];
        
        for (const variant of wowExeVariants) {
          const fullPath = path.join(clientDir, variant);
          if (fs.existsSync(fullPath)) {
            executables.push({ name: variant, path: fullPath, type: 'proton' });
            break; // ʕノ•ᴥ•ʔノ✿ Only add one variant ✿ ʕノ•ᴥ•ʔノ
          }
        }
        
        for (const variant of wowExtVariants) {
          const fullPath = path.join(clientDir, variant);
          if (fs.existsSync(fullPath)) {
            executables.push({ name: variant, path: fullPath, type: 'proton' });
            break; // ʕノ•ᴥ•ʔノ✿ Only add one variant ✿ ʕノ•ᴥ•ʔノ
          }
        }
      } catch (err) {
        // ＼ʕ •ᴥ•ʔ／✿ Directory read error, skip ✿ ＼ʕ •ᴥ•ʔ／
      }
    }
    
    return executables;
  }

  // ʕ ● ᴥ ●ʔ✿ Check if directory contains valid WoW installation ✿ ʕ ● ᴥ ●ʔ
  static isValidWoWDir(dir) {
    const executables = this.getWoWExecutables(dir);
    return executables.length > 0;
  }

  // ʕノ•ᴥ•ʔノ✿ Generate Wine prefix path for WoW ✿ ʕノ•ᴥ•ʔノ
  static getWinePrefixPath(clientDir) {
    if (!this.isLinux()) return null;
    
    const configDir = this.getConfigDir();
    const safeDirName = path.basename(clientDir).replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(configDir, 'wine_prefixes', safeDirName);
  }

  // ＼ʕ •ᴥ•ʔ／✿ Get Steam runtime paths ✿ ＼ʕ •ᴥ•ʔ／
  static getSteamPaths() {
    if (!this.isLinux()) return {};

    const homedir = os.homedir();
    return {
      steamDir: path.join(homedir, '.steam'),
      localSteamDir: path.join(homedir, '.local', 'share', 'Steam'),
      compatDataDir: path.join(homedir, '.steam', 'steam', 'steamapps', 'compatdata')
    };
  }
}

module.exports = PlatformUtils; 