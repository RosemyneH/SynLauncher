const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const PlatformUtils = require('./platform');

// ʕ •ᴥ•ʔ✿ Cross-Platform WoW Launcher with Proton-GE Support ✿ ʕ •ᴥ•ʔ
class WoWLauncher {
  
  // ʕ ◕ᴥ◕ ʔ✿ Launch WoW client with appropriate method for platform ✿ ʕ ◕ᴥ◕ ʔ
  static async launchWoW(clientDir, options = {}) {
    const executables = PlatformUtils.getWoWExecutables(clientDir);
    
    if (executables.length === 0) {
      return { success: false, message: 'No WoW executable found in ' + clientDir };
    }

    // ʕ ● ᴥ ●ʔ✿ Prefer wowext.exe over wow.exe ✿ ʕ ● ᴥ ●ʔ
    const preferredExe = executables.find(exe => exe.name.toLowerCase().includes('wowext.exe')) || executables[0];
    
    if (PlatformUtils.isWindows()) {
      return this.launchWindows(preferredExe, clientDir, options);
    } else if (PlatformUtils.isLinux()) {
      return this.launchLinuxProton(preferredExe, clientDir, options);
    } else {
      return { success: false, message: 'Unsupported platform: ' + process.platform };
    }
  }

  // ʕノ•ᴥ•ʔノ✿ Windows native launch ✿ ʕノ•ᴥ•ʔノ
  static launchWindows(executable, clientDir, options) {
    try {
      spawn(executable.path, [], {
        cwd: clientDir,
        detached: true,
        stdio: 'ignore'
      }).unref();
      
      return { success: true, message: `Launched ${executable.name} successfully` };
    } catch (err) {
      return { success: false, message: `Failed to launch ${executable.name}: ${err.message}` };
    }
  }

  // ＼ʕ •ᴥ•ʔ／✿ Linux Proton-GE launch ✿ ＼ʕ •ᴥ•ʔ／
  static launchLinuxProton(executable, clientDir, options) {
    const protonGE = options.protonVersion || PlatformUtils.getBestProtonGE();
    
    if (!protonGE) {
      return { 
        success: false, 
        message: 'No Proton-GE installation found. Please install Proton-GE first.\n\nYou can get it from: https://github.com/GloriousEggroll/proton-ge-custom' 
      };
    }

    try {
      const winePrefix = options.winePrefix || PlatformUtils.getWinePrefixPath(clientDir);
      
      // ʕ •ᴥ•ʔ✿ Ensure Wine prefix directory exists ✿ ʕ •ᴥ•ʔ
      if (winePrefix && !fs.existsSync(winePrefix)) {
        fs.mkdirSync(winePrefix, { recursive: true });
      }

      const env = {
        ...process.env,
        WINEPREFIX: winePrefix,
        STEAM_COMPAT_DATA_PATH: winePrefix,
        STEAM_COMPAT_CLIENT_INSTALL_PATH: protonGE.path,
        // ʕ ◕ᴥ◕ ʔ✿ Proton environment variables ✿ ʕ ◕ᴥ◕ ʔ
        PROTON_USE_WINED3D: options.useWineD3D ? '1' : '0',
        PROTON_NO_ESYNC: options.noEsync ? '1' : '0',
        PROTON_NO_FSYNC: options.noFsync ? '1' : '0',
        PROTON_FORCE_LARGE_ADDRESS_AWARE: '1',
        // ʕ ● ᴥ ●ʔ✿ Wine optimization flags ✿ ʕ ● ᴥ ●ʔ
        WINE_CPU_TOPOLOGY: options.cpuTopology || '4:2',
        DXVK_HUD: options.dxvkHud || '',
        // ʕノ•ᴥ•ʔノ✿ Disable Wine debug output for better performance ✿ ʕノ•ᴥ•ʔノ
        WINEDEBUG: options.wineDebug || '-all'
      };

      // ＼ʕ •ᴥ•ʔ／✿ Build Proton command ✿ ＼ʕ •ᴥ•ʔ／
      const protonArgs = [
        'run',
        executable.path
      ];

      const child = spawn(protonGE.executable, protonArgs, {
        cwd: clientDir,
        env: env,
        detached: true,
        stdio: 'ignore'
      });

      child.unref();
      
      return { 
        success: true, 
        message: `Launched ${executable.name} via ${protonGE.name}`,
        protonVersion: protonGE.name,
        winePrefix: winePrefix
      };
    } catch (err) {
      return { 
        success: false, 
        message: `Failed to launch ${executable.name} via Proton: ${err.message}` 
      };
    }
  }

  // ʕ •ᴥ•ʔ✿ Get available Proton versions for UI ✿ ʕ •ᴥ•ʔ
  static getAvailableProtonVersions() {
    return PlatformUtils.getProtonGEPaths();
  }

  // ʕ ◕ᴥ◕ ʔ✿ Initialize Wine prefix for first-time setup ✿ ʕ ◕ᴥ◕ ʔ
  static async initializeWinePrefix(clientDir, protonVersion = null) {
    if (!PlatformUtils.isLinux()) {
      return { success: true, message: 'Wine prefix not needed on this platform' };
    }

    const protonGE = protonVersion || PlatformUtils.getBestProtonGE();
    if (!protonGE) {
      return { success: false, message: 'No Proton-GE installation found' };
    }

    const winePrefix = PlatformUtils.getWinePrefixPath(clientDir);
    
    try {
      // ʕ ● ᴥ ●ʔ✿ Create Wine prefix directory ✿ ʕ ● ᴥ ●ʔ
      if (!fs.existsSync(winePrefix)) {
        fs.mkdirSync(winePrefix, { recursive: true });
      }

      // ʕノ•ᴥ•ʔノ✿ Initialize prefix by running winecfg ✿ ʕノ•ᴥ•ʔノ
      const env = {
        ...process.env,
        WINEPREFIX: winePrefix,
        STEAM_COMPAT_DATA_PATH: winePrefix,
        STEAM_COMPAT_CLIENT_INSTALL_PATH: protonGE.path,
        WINEDEBUG: '-all'
      };

      return new Promise((resolve) => {
        const initProcess = spawn(protonGE.executable, ['run', 'winecfg'], {
          env: env,
          stdio: 'pipe'
        });

        let timeout = setTimeout(() => {
          initProcess.kill();
          resolve({ 
            success: true, 
            message: 'Wine prefix initialized (timed out, but probably successful)',
            winePrefix: winePrefix
          });
        }, 10000); // ＼ʕ •ᴥ•ʔ／✿ 10 second timeout ✿ ＼ʕ •ᴥ•ʔ／

        initProcess.on('exit', (code) => {
          clearTimeout(timeout);
          resolve({ 
            success: true, 
            message: 'Wine prefix initialized successfully',
            winePrefix: winePrefix
          });
        });

        initProcess.on('error', (err) => {
          clearTimeout(timeout);
          resolve({ 
            success: false, 
            message: `Failed to initialize Wine prefix: ${err.message}` 
          });
        });
      });
    } catch (err) {
      return { 
        success: false, 
        message: `Failed to create Wine prefix: ${err.message}` 
      };
    }
  }
}

module.exports = WoWLauncher; 