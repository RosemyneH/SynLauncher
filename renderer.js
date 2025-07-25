const { ipcRenderer, remote } = require('electron');
const { downloadClientTorrent } = require('./functions');
const { PATCH_NOTES_URL } = require('./constants');

// Simple modal dialog for confirmations
function showModal(message) {
  return new Promise((resolve) => {
    // Modal overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(24,26,32,0.7)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    // Modal box
    const modal = document.createElement('div');
    modal.style.background = '#23272e';
    modal.style.color = '#eee';
    modal.style.padding = '32px 28px';
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.28)';
    modal.style.textAlign = 'center';
    modal.style.maxWidth = '90vw';
    modal.style.fontSize = '1.2rem';
    modal.innerHTML = `<div style='margin-bottom: 18px;'>${message}</div>`;

    // Buttons
    const okBtn = document.createElement('button');
    okBtn.textContent = 'Update Now';
    okBtn.style.margin = '0 12px';
    okBtn.style.padding = '8px 28px';
    okBtn.style.background = '#17406d';
    okBtn.style.color = '#fff';
    okBtn.style.border = 'none';
    okBtn.style.fontSize = '1.1rem';
    okBtn.style.borderRadius = '4px';
    okBtn.style.cursor = 'pointer';
    okBtn.onmouseover = () => okBtn.style.background = '#0d2238';
    okBtn.onmouseleave = () => okBtn.style.background = '#17406d';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.margin = '0 12px';
    cancelBtn.style.padding = '8px 28px';
    cancelBtn.style.background = '#444';
    cancelBtn.style.color = '#fff';
    cancelBtn.style.border = 'none';
    cancelBtn.style.fontSize = '1.1rem';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.onmouseover = () => cancelBtn.style.background = '#222';
    cancelBtn.onmouseleave = () => cancelBtn.style.background = '#444';

    okBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    cancelBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };

    modal.appendChild(okBtn);
    modal.appendChild(cancelBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}

// ʕ ◕ᴥ◕ ʔ✿ Linux Settings Dialog ✿ ʕ ◕ᴥ◕ ʔ
async function showLinuxSettings(clientDir) {
  const platformInfo = await ipcRenderer.invoke('get-platform-info');
  
  let settingsHTML = `
    <div style="max-width: 500px; padding: 20px; background: #1e2328; border-radius: 10px; color: #fff;">
      <h3 style="margin-top: 0; color: #4CAF50;">Linux Settings</h3>
      
      <div style="margin-bottom: 15px;">
        <strong>Platform:</strong> ${platformInfo.platform}<br>
        <strong>Config Directory:</strong> ${platformInfo.configDir}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Available Proton-GE versions:</strong><br>
  `;
  
  if (platformInfo.protonVersions.length > 0) {
    settingsHTML += '<ul style="margin: 5px 0; padding-left: 20px;">';
    platformInfo.protonVersions.forEach(version => {
      settingsHTML += `<li>${version.name} (${version.path})</li>`;
    });
    settingsHTML += '</ul>';
  } else {
    settingsHTML += '<span style="color: #ff6b6b;">No Proton-GE installations found!</span><br>';
    settingsHTML += '<a href="#" id="proton-install-link" style="color: #4CAF50; cursor: pointer; pointer-events: auto; position: relative; z-index: 10001;">Install Proton-GE</a>';
  }
  
  settingsHTML += `
      </div>
      
      <div style="margin-bottom: 15px;">
        <button id="wine-prefix-init-btn" data-client-dir="${clientDir}" style="display: block; width: 180px; height: 40px; background: #4CAF50; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; pointer-events: auto; position: relative; z-index: 99999; font-size: 14px; font-weight: 500; text-align: center; line-height: 1; margin: 5px 0; box-sizing: border-box;">
          Initialize Wine Prefix
        </button>
        <small style="display: block; margin-top: 5px; color: #aaa;">
          Run this if you encounter issues launching WoW
        </small>
      </div>
      

    </div>
  `;
  
  await showCustomModal(settingsHTML);
}

// ʕ ● ᴥ ●ʔ✿ Initialize Wine Prefix helper ✿ ʕ ● ᴥ ●ʔ
async function initWinePrefix(clientDir) {
  showStatus('Initializing Wine prefix...');
  const result = await ipcRenderer.invoke('init-wine-prefix', clientDir);
  showStatus(result.message);
  if (result.success) {
    setTimeout(() => {
      closeModal();
    }, 2000);
  }
}

// ʕノ•ᴥ•ʔノ✿ Simple modal with direct button handling ✿ ʕノ•ᴥ•ʔノ
async function showCustomModal(htmlContent) {
  const modal = document.createElement('div');
  modal.id = 'custom-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0,0,0,0.8)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '10000';
  modal.innerHTML = htmlContent;
  
  document.body.appendChild(modal);
  
  // ʕ •ᴥ•ʔ✿ Force button interactivity with immediate setup ✿ ʕ •ᴥ•ʔ
  const setupButtons = async () => {
    
    const initBtn = document.getElementById('wine-prefix-init-btn');
    const protonLink = document.getElementById('proton-install-link');
    
        // ʕ ◕ᴥ◕ ʔ✿ Close button removed - use X button in top right instead ✿ ʕ ◕ᴥ◕ ʔ
    
    if (initBtn) {
      // ʕ •ᴥ•ʔ✿ Force button to be fully clickable with proper dimensions ✿ ʕ •ᴥ•ʔ
      initBtn.style.display = 'block';
      initBtn.style.width = '180px';
      initBtn.style.height = '40px';
      initBtn.style.minWidth = '180px';
      initBtn.style.minHeight = '40px';
      initBtn.style.pointerEvents = 'auto';
      initBtn.style.zIndex = '99999';
      initBtn.style.position = 'relative';
      initBtn.style.cursor = 'pointer';
      initBtn.style.background = '#4CAF50';
      initBtn.style.border = 'none';
      initBtn.style.borderRadius = '6px';
      initBtn.style.color = 'white';
      initBtn.style.padding = '12px 20px';
      initBtn.style.fontSize = '14px';
      initBtn.style.fontWeight = '500';
      initBtn.style.textAlign = 'center';
      initBtn.style.lineHeight = '1';
      initBtn.style.margin = '5px 0';
      initBtn.style.boxSizing = 'border-box';
      
      initBtn.addEventListener('mouseenter', () => {
        initBtn.style.background = '#45a049';
        initBtn.style.transform = 'scale(1.02)';
      });
      
      initBtn.addEventListener('mouseleave', () => {
        initBtn.style.background = '#4CAF50';
        initBtn.style.transform = 'scale(1)';
      });
      
      initBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const clientDir = initBtn.getAttribute('data-client-dir');
        await initWinePrefix(clientDir);
      });
    }
    
    if (protonLink) {
      console.log('Setting up proton link');
      protonLink.style.pointerEvents = 'auto';
      protonLink.style.zIndex = '10002';
      protonLink.style.position = 'relative';
      protonLink.style.cursor = 'pointer';
      
      protonLink.onmouseenter = () => {
        protonLink.style.color = '#66bb6a';
        protonLink.style.textDecoration = 'underline';
        console.log('Proton link hovered');
      };
      protonLink.onmouseleave = () => {
        protonLink.style.color = '#4CAF50';
        protonLink.style.textDecoration = 'none';
      };
      protonLink.onclick = (e) => {
        console.log('Proton link clicked!');
        e.preventDefault();
        e.stopPropagation();
        const { shell } = require('electron');
        shell.openExternal('https://github.com/GloriousEggroll/proton-ge-custom#installation');
      };
    }
  };
  
  // ʕ ◕ᴥ◕ ʔ✿ Set up buttons immediately ✿ ʕ ◕ᴥ◕ ʔ
  await setupButtons();
  
  // ʕノ•ᴥ•ʔノ✿ Click outside modal content to close ✿ ʕノ•ᴥ•ʔノ
  modal.onclick = async (e) => {
    // Only close if clicking the modal background (not the content inside)
    if (e.target === modal) {
      await closeModal();
    }
  };
}

async function closeModal() {
  const modal = document.getElementById('custom-modal');
  if (modal) {
    modal.remove();
  }
  
  // ʕ •ᴥ•ʔ✿ Also remove any status messages when closing ✿ ʕ •ᴥ•ʔ
  const status = document.getElementById('status');
  if (status && status.textContent.includes('Wine prefix')) {
    status.style.display = 'none';
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  // Check for launcher updates
  try {
    const updateInfo = await ipcRenderer.invoke('check-for-launcher-update');
    if (updateInfo && updateInfo.updateAvailable) {
      let msg = `A new version of the Synastria Launcher is available!\n\n`;
      msg += `Latest version: v${updateInfo.latestVersion}\n`;
      msg += `Release: ${updateInfo.releaseName || ''}\n\n`;
      if (updateInfo.body) {
        msg += `${updateInfo.body.substring(0, 350)}\n\n`;
      }
      msg += `Would you like to download it now?`;
      const confirmed = await (typeof showModal === 'function'
        ? showModal(msg)
        : Promise.resolve(window.confirm(msg)));
      if (confirmed) {
        try {
          await ipcRenderer.invoke('download-launcher-update', updateInfo.downloadUrl);
          alert('Installer is downloading. The launcher will close when the installer starts.');
        } catch (err) {
          alert('Failed to start download: ' + (err && err.message ? err.message : err));
        }
      }
    }
  } catch (err) {
    // Optionally log or ignore update check errors
  }
  // Make body draggable except for controls
  document.body.style['-webkit-app-region'] = 'drag';

  // Add custom exit button (top right) - made lighter for better visibility
  const exitBtn = document.createElement('button');
  exitBtn.textContent = '✕';
  exitBtn.title = 'Close';
  exitBtn.style.position = 'fixed';
  exitBtn.style.top = '18px';
  exitBtn.style.right = '22px';
  exitBtn.style.width = '38px';
  exitBtn.style.height = '38px';
  exitBtn.style.fontSize = '1.5rem';
  exitBtn.style.background = 'rgba(100,110,125,0.9)';
  exitBtn.style.color = '#fff';
  exitBtn.style.border = 'none';
  exitBtn.style.borderRadius = '8px';
  exitBtn.style.cursor = 'pointer';
  exitBtn.style.zIndex = '10000';
  exitBtn.style['-webkit-app-region'] = 'no-drag';
  exitBtn.onmouseover = () => exitBtn.style.background = '#a62828';
  exitBtn.onmouseleave = () => exitBtn.style.background = 'rgba(100,110,125,0.9)';
  exitBtn.onclick = () => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.invoke('close-window');
  };

  document.body.appendChild(exitBtn);

  const { extractPatchVersion } = require('./functions');
  const { getPatchDownloadLink } = require('./patch_scraper');

  // Helper: Checks for patch update and installs if needed
  async function checkAndUpdatePatch(config) {
    showStatus('Checking for updates...');
    try {
      const latestPatchUrl = await getPatchDownloadLink();
      if (!latestPatchUrl) {
        showStatus('Could not check for patch updates.');
        return false;
      }
      const latestVersion = extractPatchVersion(latestPatchUrl);
      if (!latestVersion) {
        showStatus('Could not determine latest patch version.');
        return false;
      }
      if (!config || config.patchVersion !== latestVersion) {
        const confirmed = await showModal('A new version of the patch is available!\n\nWould you like to update now?');
        if (!confirmed) {
          showStatus('Update cancelled. You may not be able to play until updated.');
          return false;
        }
        showStatus('Downloading latest patch...');
        const result = await ipcRenderer.invoke('download-and-install-patch', config && config.clientDir ? config.clientDir : '');
        showStatus(result.message);
        // Reload config after update
        return true;
      }
      showStatus('Launcher is up to date.');
      return false;
    } catch (err) {
      showStatus('Error checking for updates: ' + err.message);
      return false;
    }
  }


// Show only a Play button after patch is installed
async function showPlayButton(clientDir) {
  // Clear all launcher content
  document.body.innerHTML = '';

  // Add custom exit button (top right) - made lighter for better visibility
  let exitBtn = document.getElementById('custom-exit-btn');
  if (exitBtn) exitBtn.remove();
  exitBtn = document.createElement('button');
  exitBtn.id = 'custom-exit-btn';
  exitBtn.textContent = '✕';
  exitBtn.title = 'Close';
  exitBtn.style.position = 'fixed';
  exitBtn.style.top = '18px';
  exitBtn.style.right = '22px';
  exitBtn.style.width = '38px';
  exitBtn.style.height = '38px';
  exitBtn.style.fontSize = '1.5rem';
  exitBtn.style.background = 'rgba(100,110,125,0.9)';
  exitBtn.style.color = '#fff';
  exitBtn.style.border = 'none';
  exitBtn.style.borderRadius = '8px';
  exitBtn.style.cursor = 'pointer';
  exitBtn.style.zIndex = '10000';
  exitBtn.style['-webkit-app-region'] = 'no-drag';
  exitBtn.onmouseover = () => exitBtn.style.background = '#a62828';
  exitBtn.onmouseleave = () => exitBtn.style.background = 'rgba(100,110,125,0.9)';
  exitBtn.onclick = () => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.invoke('close-window');
  };

  document.body.appendChild(exitBtn);

  // Set up flex column layout for body
  document.body.style.display = 'flex';
  document.body.style.flexDirection = 'column';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';
  document.body.style.height = '100vh';
  document.body.style.margin = '0';
  document.body.style.background = "#181a20 url('background.png') center center / cover no-repeat fixed";
  document.body.style.position = 'relative';

  // Overlay for darkening the background for readability
  let overlay = document.getElementById('bg-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'bg-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(24,26,32,0.6)'; // lighter overlay
    overlay.style.zIndex = '0';
    overlay.style.pointerEvents = 'none';
    document.body.insertBefore(overlay, document.body.firstChild);
  }

  // Inject modern scrollbar CSS for patch notes
  const style = document.createElement('style');
  style.textContent = `
    .patch-notes::-webkit-scrollbar {
      width: 10px;
    }
    .patch-notes::-webkit-scrollbar-thumb {
      background: #2e3540;
      border-radius: 8px;
      border: 2px solid #23272e;
    }
    .patch-notes::-webkit-scrollbar-track {
      background: #23272e;
      border-radius: 8px;
    }
    .patch-notes {
      scrollbar-width: thin;
      scrollbar-color: #2e3540 #23272e;
    }
  `;
  document.head.appendChild(style);

  // Patch notes area
  const patchNotes = document.createElement('div');
  patchNotes.style.width = '90%';
  patchNotes.style.maxWidth = '600px';
  patchNotes.style.height = '60%';
  patchNotes.style.maxHeight = '320px';
  patchNotes.style.margin = '0 auto 32px auto';
  patchNotes.style.background = '#23272e';
  patchNotes.style.color = '#eee';
  patchNotes.style.border = '2px solid #444';
  patchNotes.style.borderRadius = '0';
  patchNotes.style.padding = '24px';
  patchNotes.style.overflowY = 'auto';
  patchNotes.style.fontSize = '1.1rem';
  patchNotes.style.boxSizing = 'border-box';
  patchNotes.className = 'patch-notes';
  patchNotes.style.zIndex = '1';
  patchNotes.style['-webkit-app-region'] = 'no-drag';
  // patchNotes.innerHTML = PATCH_NOTES_HTML;
  // Dynamically fetch patch notes from remote URL
  fetch(PATCH_NOTES_URL)
    .then(response => response.text())
    .then(html => {
      patchNotes.innerHTML = html;
    })
    .catch(err => {
      patchNotes.innerHTML = ('<b>Failed to load patch notes.</b>' + err);
      console.error('Failed to fetch patch notes:', err);
    });
  document.body.appendChild(patchNotes);

  // Play button
  const playBtn = document.createElement('button');
  playBtn.textContent = 'Launch Synastria';
  playBtn.style.fontSize = '1.5rem';
  playBtn.style.width = '320px';
  playBtn.style.height = '64px';
  playBtn.style.whiteSpace = 'nowrap';
  playBtn.style.overflow = 'hidden';
  playBtn.style.textOverflow = 'ellipsis';
  playBtn.style.background = '#17406d';
  playBtn.style.margin = '0 auto';
  playBtn.style.display = 'block';
  playBtn.style.background = '#1e90ff';
  playBtn.style.color = '#fff';
  playBtn.style.border = 'none';
  playBtn.style.borderRadius = '0';
  playBtn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.20)';
  playBtn.style.cursor = 'pointer';
  playBtn.style.fontWeight = 'bold';
  playBtn.style.letterSpacing = '0.1em';
  playBtn.style.transition = 'background 0.2s';
  playBtn.style.zIndex = '1';
  playBtn.style['-webkit-app-region'] = 'no-drag';
  playBtn.onmouseover = () => playBtn.style.background = '#0d2238';
  playBtn.onmouseleave = () => playBtn.style.background = '#17406d';
  playBtn.onclick = async () => {
    // ʕ •ᴥ•ʔ✿ Check if we're on Linux and need Proton setup ✿ ʕ •ᴥ•ʔ
    const platformInfo = await ipcRenderer.invoke('get-platform-info');
    if (platformInfo.isLinux && platformInfo.protonVersions.length === 0) {
      const installProton = await showModal(
        'No Proton-GE installation found!\n\n' +
        'To play WoW on Linux, you need Proton-GE installed.\n' +
        'Would you like to open the installation guide?'
      );
      if (installProton) {
        const { shell } = require('electron');
        shell.openExternal('https://github.com/GloriousEggroll/proton-ge-custom#installation');
      }
      return;
    }
    
    // ʕ ◕ᴥ◕ ʔ✿ Launch with platform-appropriate method ✿ ʕ ◕ᴥ◕ ʔ
    const result = await ipcRenderer.invoke('launch-wowext', clientDir);
    if (!result.success) {
      alert('Launch failed: ' + result.message);
    } else if (platformInfo.isLinux) {
      // ʕ ● ᴥ ●ʔ✿ Show Linux-specific success message ✿ ʕ ● ᴥ ●ʔ
      console.log(`Launched via ${result.protonVersion || 'Proton-GE'}`);
    }
  };
  document.body.appendChild(playBtn);

  // Addons button
  const addonsBtn = document.createElement('button');
  addonsBtn.textContent = 'Manage Addons';
  addonsBtn.style.fontSize = '1rem';
  addonsBtn.style.width = '180px';
  addonsBtn.style.height = '38px';
  addonsBtn.style.marginTop = '16px';
  addonsBtn.style.background = '#283046';
  addonsBtn.style.color = '#fff';
  addonsBtn.style.border = 'none';
  addonsBtn.style.borderRadius = '5px';
  addonsBtn.style.cursor = 'pointer';
  addonsBtn.style.boxShadow = '0 2px 8px rgba(80,80,80,0.08)';
  addonsBtn.style['-webkit-app-region'] = 'no-drag';
  addonsBtn.onmouseover = () => addonsBtn.style.background = '#1a1d21';
  addonsBtn.onmouseleave = () => addonsBtn.style.background = '#283046';

  let addonsPanel = null;
  addonsBtn.onclick = async () => {
    if (addonsPanel && addonsPanel.parentNode) {
      // Instead of removing the panel, just refresh its contents
      // Remove all children except for the panel container itself
      while (addonsPanel.firstChild) {
        addonsPanel.removeChild(addonsPanel.firstChild);
      }
      // Continue to repopulate the panel below (do not return)
    }
    // Remove any existing panel
    if (addonsPanel) addonsPanel.remove();
    addonsPanel = document.createElement('div');
    addonsPanel.style.position = 'fixed';
    addonsPanel.style.top = '0';
    addonsPanel.style.left = '0';
    addonsPanel.style.width = '100vw';
    addonsPanel.style.height = '100vh';
    addonsPanel.style.maxWidth = '100vw';
    addonsPanel.style.maxHeight = '100vh';
    addonsPanel.style.overflowY = 'auto';
    addonsPanel.style.margin = '0';
    addonsPanel.style.paddingTop = '60px'; // leave a little space for header
    addonsPanel.style.boxSizing = 'border-box';
    // Modern custom scrollbar for the addons panel
    const addonsScrollbarStyle = document.createElement('style');
    addonsScrollbarStyle.textContent = `
      .synastria-addons-panel::-webkit-scrollbar {
        width: 12px;
        background: #23272e;
        border-radius: 8px;
      }
      .synastria-addons-panel::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #38415a 0%, #23272e 100%);
        border-radius: 8px;
        border: 2px solid #23272e;
      }
      .synastria-addons-panel::-webkit-scrollbar-thumb:hover {
        background: #4e5a7a;
      }
    `;
    document.head.appendChild(addonsScrollbarStyle);
    addonsPanel.classList.add('synastria-addons-panel');
    addonsPanel.style.background = 'rgba(30,36,48,0.97)';
    addonsPanel.style.borderRadius = '12px';
    addonsPanel.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.23)';
    addonsPanel.style.padding = '24px 18px 18px 18px';
    addonsPanel.style.zIndex = '20001';
    addonsPanel.style.display = 'flex';
    addonsPanel.style.flexDirection = 'column';
    addonsPanel.style.gap = '0px';

    // Addons panel header
    const header = document.createElement('div');
    header.textContent = 'Manage Addons';
    header.style.fontSize = '1.3rem';
    header.style.fontWeight = '600';
    header.style.color = '#fff';
    header.style.marginBottom = '18px';
    header.style.letterSpacing = '0.5px';
    addonsPanel.appendChild(header);

    // Fetch list
    const res = await ipcRenderer.invoke('get-addons-list');
    if (!res.success) {
      showModal('Failed to load addons: ' + res.message);
      return;
    }
    const addons = res.addons;
    // Zebra-striped list
    addons.forEach((addon, idx) => {
      const row = document.createElement('div');
      row.style.background = idx % 2 === 0 ? 'rgba(40,44,60,0.92)' : 'rgba(32,36,48,0.87)';
      row.style.display = 'flex';
      row.style.flexDirection = 'row';
      row.style.alignItems = 'center';
      row.style.padding = '4px 10px'; // reduced top-bottom padding
      row.style.borderRadius = '7px';
      row.style.marginBottom = '2px';
      row.style.fontFamily = 'Montserrat, Arial, sans-serif';
      row.style.fontSize = '0.95rem'; // globally smaller font
      row.style.transition = 'background 0.13s';

      // Name
      const name = document.createElement('div');
      name.textContent = addon.name;
      name.style.fontWeight = '600';
      name.style.fontSize = '0.99rem';
      name.style.marginRight = '14px';
      name.style.color = '#fff';
      name.style.flex = '0 0 180px';
      name.style.marginRight = '18px';
      row.appendChild(name);

      // Description
      const desc = document.createElement('div');
      desc.textContent = addon.description;
      desc.style.fontSize = '0.93rem';
      desc.style.color = '#b6c1dc';
      desc.style.flex = '1 1 auto';
      desc.style.marginRight = '14px';
      row.appendChild(desc);

      // Author
      const author = document.createElement('div');
      author.textContent = addon.Author || addon.author || '—';
      author.style.fontSize = '0.93rem';
      author.style.color = '#8fd4ff';
      author.style.flex = '0 0 100px';
      author.style.marginRight = '14px';
      author.style.textAlign = 'left';
      row.appendChild(author);

      // Last updated
      // Helper for formatting dates as 'Apr 1 2025'
      function formatAddonDate(dateString) {
        const date = new Date(dateString);
        const month = date.toLocaleString('en-US', { month: 'short' });
        return `${month} ${date.getDate()} ${date.getFullYear()}`;
      }
      const lastUpdated = document.createElement('div');
      lastUpdated.innerHTML = addon.lastUpdated ? `Updated:<br>${formatAddonDate(addon.lastUpdated)}` : 'Not installed';
      lastUpdated.style.fontSize = '0.92rem';
      lastUpdated.style.color = addon.installed ? '#5ad17a' : '#c5c5c5';
      lastUpdated.style.marginRight = '14px';
      lastUpdated.style.flex = '0 0 120px';
      lastUpdated.style.textAlign = 'right';
      row.appendChild(lastUpdated);

      // Actions (Install/Uninstall)
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.flexDirection = 'row';
      actions.style.alignItems = 'center';
      actions.style.gap = '10px';
      actions.style.flex = '0 0 auto';

      // Install/Uninstall/Update buttons
      if (!addon.installed) {
        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install';
        installBtn.style.background = '#17406d';
        installBtn.style['-webkit-app-region'] = 'no-drag';
        installBtn.style.color = '#fff';
        installBtn.style.border = 'none';
        installBtn.style.borderRadius = '4px';
        installBtn.style.padding = '6px 18px';
        installBtn.style.fontSize = '1rem';
        installBtn.style.cursor = 'pointer';
        installBtn.onmouseover = () => installBtn.style.background = '#0d2238';
        installBtn.onmouseleave = () => installBtn.style.background = '#17406d';
        installBtn.onclick = async (e) => {
          e.stopPropagation();
          actions.style.opacity = '0.6';
          installBtn.disabled = true;
          const resp = await ipcRenderer.invoke('install-addon', addon, clientDir);
          actions.style.opacity = '';
          installBtn.disabled = false;
          if (!resp.success) {
            showModal('Install failed: ' + resp.message);
          } else {
            // Refresh the panel in place
            addonsBtn.onclick();
          }
        };
        actions.appendChild(installBtn);
      } else {
        // Only show uninstall button now that auto-update is always handled
        const uninstallBtn = document.createElement('button');
        uninstallBtn.textContent = 'Uninstall';
        uninstallBtn.style.background = '#a62828';
        uninstallBtn.style['-webkit-app-region'] = 'no-drag';
        uninstallBtn.style.color = '#fff';
        uninstallBtn.style.border = 'none';
        uninstallBtn.style.borderRadius = '4px';
        uninstallBtn.style.padding = '6px 18px';
        uninstallBtn.style.fontSize = '1rem';
        uninstallBtn.style.cursor = 'pointer';
        uninstallBtn.onmouseover = () => uninstallBtn.style.background = '#6d1717';
        uninstallBtn.onmouseleave = () => uninstallBtn.style.background = '#a62828';
        uninstallBtn.onclick = async (e) => {
          e.stopPropagation();
          actions.style.opacity = '0.6';
          uninstallBtn.disabled = true;
          const resp = await ipcRenderer.invoke('uninstall-addon', addon, clientDir);
          actions.style.opacity = '';
          uninstallBtn.disabled = false;
          if (!resp.success) {
            showModal('Uninstall failed: ' + resp.message);
          } else {
            // Refresh the panel in place
            addonsBtn.onclick();
          }
        };
        actions.appendChild(uninstallBtn);
      }

      row.appendChild(actions);
      addonsPanel.appendChild(row);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.background = '#23272e';
    closeBtn.style['-webkit-app-region'] = 'no-drag';
    closeBtn.style.margin = '18px auto 0 auto';
    closeBtn.style.display = 'block';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.padding = '8px 38px';
    closeBtn.style.fontSize = '1.08rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onmouseover = () => closeBtn.style.background = '#111';
    closeBtn.onmouseleave = () => closeBtn.style.background = '#222';
    closeBtn.onclick = () => {
      addonsPanel.remove();
      addonsPanel = null;
    };
    addonsPanel.appendChild(closeBtn);

    document.body.appendChild(addonsPanel);
  };
  document.body.appendChild(addonsBtn);

  // ʕ •ᴥ•ʔ✿ Add Linux settings button if on Linux ✿ ʕ •ᴥ•ʔ
  const platformInfo = await ipcRenderer.invoke('get-platform-info');
  if (platformInfo.isLinux) {
    const linuxSettingsBtn = document.createElement('button');
    linuxSettingsBtn.textContent = 'Linux Settings';
    linuxSettingsBtn.style.fontSize = '0.9rem';
    linuxSettingsBtn.style.width = '140px';
    linuxSettingsBtn.style.height = '32px';
    linuxSettingsBtn.style.marginTop = '8px';
    linuxSettingsBtn.style.background = '#2d5c3e';
    linuxSettingsBtn.style.color = '#fff';
    linuxSettingsBtn.style.border = 'none';
    linuxSettingsBtn.style.borderRadius = '5px';
    linuxSettingsBtn.style.cursor = 'pointer';
    linuxSettingsBtn.style.boxShadow = '0 2px 8px rgba(80,80,80,0.08)';
    linuxSettingsBtn.style['-webkit-app-region'] = 'no-drag';
    linuxSettingsBtn.onmouseover = () => linuxSettingsBtn.style.background = '#234a32';
    linuxSettingsBtn.onmouseleave = () => linuxSettingsBtn.style.background = '#2d5c3e';
    linuxSettingsBtn.onclick = async () => {
      try {
        await showLinuxSettings(clientDir);
      } catch (error) {
        console.error('Error in Linux Settings:', error);
      }
    };
    document.body.appendChild(linuxSettingsBtn);
  }
}


  const status = document.getElementById('status');
  const progressBar = document.getElementById('progress');
  const mainActions = document.getElementById('main-actions');
  const chooseExistingBtn = document.getElementById('chooseExistingBtn');
  const downloadClientBtn = document.getElementById('downloadClientBtn');
  const cancelDownloadBtn = document.getElementById('cancelDownloadBtn');

  // Ensure these buttons ignore drag (no-drag region)
  chooseExistingBtn.style['-webkit-app-region'] = 'no-drag';
  downloadClientBtn.style['-webkit-app-region'] = 'no-drag';

  const configExists = await ipcRenderer.invoke('check-config');
  const constants = await ipcRenderer.invoke('get-constants');

  function showStatus(msg) {
    status.innerText = msg;
    status.style.display = 'block';
  }
  function hideStatus() {
    status.style.display = 'none';
  }
  function showProgress() {
    progressBar.style.display = 'block';
    cancelDownloadBtn.style.display = 'inline-block';
  }
  function hideProgress() {
    progressBar.style.display = 'none';
    cancelDownloadBtn.style.display = 'none';
    progressBar.value = 0;
    progressBar.classList.remove('indeterminate');
    progressBar.removeAttribute('value');
  }

  let config = null;
  let clientDetected = false;
  if (configExists) {
    config = await ipcRenderer.invoke('load-config');
    // Check for patch updates before proceeding
    const updated = await checkAndUpdatePatch(config);
    if (updated) {
      // Reload config after update
      config = await ipcRenderer.invoke('load-config');
    }
    // If client is installed and clientDir is set, proceed to validate and update addons
    if (config && config.clientDir) {
      const isValid = await ipcRenderer.invoke('validate-wow-dir', config.clientDir);
      if (isValid) {
        showStatus('WoW client detected. Checking for addon updates...');
        await ipcRenderer.invoke('auto-update-addons', config.clientDir);
        // Reload config to get updated hash and state
        config = await ipcRenderer.invoke('load-config');
        // Now check for wowext.exe and show play button if present
        const executables = await ipcRenderer.invoke('get-wow-executables', config.clientDir);
        const hasWowExt = executables.some(exe => exe.name.toLowerCase().includes('wowext.exe'));
        if (hasWowExt) {
          showStatus('WoW client detected. Ready to launch Synastria!');
          hideProgress();
          mainActions.style.display = 'none';
          clientDetected = true;
          await showPlayButton(config.clientDir);
          return;
        }
      }
    }
  }

  const clientNotDetectedDiv = document.getElementById('clientNotDetected');
  if (!clientDetected) {
    mainActions.style.display = 'block';
    clientNotDetectedDiv.style.display = 'block';
    hideStatus();
    hideProgress();
  } else {
    clientNotDetectedDiv.style.display = 'none';
  }

  chooseExistingBtn.onclick = async () => {
    const result = await ipcRenderer.invoke('select-directory');
    if (result && result.length > 0) {
      const chosenDir = result[0];
      const isValid = await ipcRenderer.invoke('validate-wow-dir', chosenDir);
      if (!isValid) {
        const platformInfo = await ipcRenderer.invoke('get-platform-info');
        const message = platformInfo.isLinux 
          ? 'Selected directory does not contain wow.exe or wowext.exe. On Linux, you need the Windows WoW client files to run via Proton-GE.'
          : 'Selected directory does not contain wow.exe or wowext.exe. Please select a valid WoW client folder.';
        alert(message);
        return;
      }
      await ipcRenderer.invoke('save-config', { installed: true, clientDir: chosenDir });
      
      // ʕ •ᴥ•ʔ✿ Get platform-aware executable info ✿ ʕ •ᴥ•ʔ
      const platformInfo = await ipcRenderer.invoke('get-platform-info');
      const executables = await ipcRenderer.invoke('get-wow-executables', chosenDir);
      
      const hasWow = executables.some(exe => exe.name.toLowerCase().includes('wow.exe'));
      const hasWowExt = executables.some(exe => exe.name.toLowerCase().includes('wowext.exe'));
      
      if (hasWow && !hasWowExt) {
        showStatus('wowext.exe not found. Downloading patch...');
        try {
          const result = await ipcRenderer.invoke('download-and-install-patch', chosenDir);
          console.log('Patch download result:', result);
          showStatus(result.message);
          if (result.success) {
            await showPlayButton(chosenDir);
          }
        } catch (err) {
          showStatus('Error downloading patch: ' + err.message);
        }
        mainActions.style.display = 'none';
      } else {
        showStatus('WoW client detected! Launching interface...');
        mainActions.style.display = 'none';
        await showPlayButton(chosenDir);
      }
    }
  };

  let currentClient = null;
  downloadClientBtn.onclick = async () => {
    const result = await ipcRenderer.invoke('select-directory');
    if (result && result.length > 0) {
      const destDir = result[0];
      mainActions.style.display = 'none';
      showStatus('Downloading client...');
      showProgress();
      const { extractClient } = require('./functions');
      const zipPath = require('path').join(destDir, constants.CLIENT_ZIP_FILE);
      let extractingInProgress = false;
      currentClient = downloadClientTorrent(
        constants.MAGNET_LINK,
        destDir,
        (percent) => {
          if (!extractingInProgress) {
            progressBar.value = percent;
            showStatus(`Downloading: ${percent}%`);
          }
        },
        async () => {
          extractingInProgress = true;
          progressBar.value = 100;
          hideProgress();
          showStatus('Extraction in Progress...');
          // Show indeterminate progress bar
          progressBar.classList.add('indeterminate');
          progressBar.removeAttribute('value');
          showProgress();
          setTimeout(() => {
            extractClient(zipPath, destDir, (movePercent) => {
              // Switch to determinate mode during file moves
              progressBar.classList.remove('indeterminate');
              progressBar.value = movePercent;
            })
              .then(async () => {
                extractingInProgress = false;
                showStatus('Extraction complete! Downloading patch...');
                try {
                  const result = await ipcRenderer.invoke('download-and-install-patch', destDir);
                  console.log('Patch download result:', result);
                  showStatus(result.message);
                  if (result.success) {
                    await showPlayButton(destDir);
                  }
                } catch (err) {
                  showStatus('Error downloading patch: ' + err.message);
                }
                let config = await ipcRenderer.invoke('load-config') || {};
config.installed = true;
config.clientDir = destDir;
// patchVersion is preserved if already set by main.js after patching
await ipcRenderer.invoke('save-config', config);
                // Extraction and moves complete
                progressBar.value = 100;
                hideProgress();
                currentClient = null;
              })
              .catch((err) => {
                extractingInProgress = false;
                showStatus('Extraction failed: ' + err.message);
                hideProgress();
                currentClient = null;
              });
          }, 0);
        }
      );
    }
  };

  cancelDownloadBtn.onclick = () => {
    if (currentClient) {
      currentClient.destroy();
      showStatus('Download cancelled.');
      hideProgress();
      mainActions.style.display = 'block';
      currentClient = null;
    }
  };
});
