
// app.js — Application entry point
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[SIPANDU] Initializing Web Admin...');

  // ==========================================
  // 1. MOBILE SIDEBAR
  // ==========================================

  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');

      if (overlay) {
        overlay.classList.toggle(
          'active',
          sidebar.classList.contains('open')
        );
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // ==========================================
  // 2. RESTORE SAVED IP CONFIGURATION
  // ==========================================

  const esp32Input = document.getElementById('esp32-ip-input');
  const jetsonInput = document.getElementById('jetson-ip-input');

  try {
    const savedESP32 = localStorage.getItem('sipandu_esp32_ip');
    const savedJetson = localStorage.getItem('sipandu_jetson_ip');

    if (savedESP32 && esp32Input) {
      esp32Input.value = savedESP32;
    }

    if (savedJetson && jetsonInput) {
      jetsonInput.value = savedJetson;
    }
  } catch (err) {
    console.warn('[App] Gagal membaca konfigurasi IP:', err);
  }

  // ==========================================
  // 3. ESP32 CONFIGURATION
  // ==========================================

  const esp32Button = document.getElementById('esp32-ip-save');

  if (esp32Button && esp32Input) {
    esp32Button.addEventListener('click', () => {
      const ip = esp32Input.value.trim();

      if (!ip) {
        if (typeof Utils !== 'undefined' && Utils.toast) {
          Utils.toast('Masukkan IP ESP32 terlebih dahulu', 'error');
        }
        return;
      }

      try {
        const baseURL = /^https?:\/\//i.test(ip)
          ? ip
          : `http://${ip}`;

        if (
          typeof ESP32API === 'undefined' ||
          typeof ESP32API.setBaseURL !== 'function'
        ) {
          throw new Error('ESP32API.setBaseURL tidak tersedia');
        }

        ESP32API.setBaseURL(baseURL);
        localStorage.setItem('sipandu_esp32_ip', ip);

        if (typeof Realtime !== 'undefined') {
          Realtime.restart();
        }

        if (typeof Utils !== 'undefined' && Utils.toast) {
          Utils.toast('IP ESP32 berhasil diterapkan', 'success');
        }

      } catch (err) {
        console.error('[App] ESP32 config error:', err);

        if (typeof Utils !== 'undefined' && Utils.toast) {
          Utils.toast('Gagal menerapkan IP ESP32', 'error');
        }
      }
    });
  }

  // ==========================================
  // 4. JETSON CONFIGURATION
  // ==========================================

  const jetsonButton = document.getElementById('jetson-ip-save');

  if (jetsonButton && jetsonInput) {
    jetsonButton.addEventListener('click', () => {
      const ip = jetsonInput.value.trim();

      if (!ip) {
        if (typeof Utils !== 'undefined' && Utils.toast) {
          Utils.toast('Masukkan IP Jetson Nano terlebih dahulu', 'error');
        }
        return;
      }

      try {
        const baseURL = /^https?:\/\//i.test(ip)
          ? ip
          : `http://${ip}`;

        if (
          typeof JetsonAPI === 'undefined' ||
          typeof JetsonAPI.setBaseURL !== 'function'
        ) {
          throw new Error('JetsonAPI.setBaseURL tidak tersedia');
        }

        JetsonAPI.setBaseURL(baseURL);
        localStorage.setItem('sipandu_jetson_ip', ip);

        if (typeof Camera !== 'undefined' &&
            typeof Camera.refresh === 'function') {
          Camera.refresh();
        }

        if (typeof Utils !== 'undefined' && Utils.toast) {
          Utils.toast('IP Jetson Nano berhasil diterapkan', 'success');
        }

      } catch (err) {
        console.error('[App] Jetson config error:', err);

        if (typeof Utils !== 'undefined' && Utils.toast) {
          Utils.toast('Gagal menerapkan IP Jetson Nano', 'error');
        }
      }
    });
  }

  // ==========================================
  // 5. INITIALIZE ROUTER FIRST
  // ==========================================

  if (typeof Router !== 'undefined') {
    Router.init();
    console.log('[SIPANDU] Router initialized');
  } else {
    console.error('[SIPANDU] Router module not found');
  }

  // ==========================================
  // 6. INITIALIZE APPLICATION MODULES
  // ==========================================

  function safeInit(name, module) {
    if (module && typeof module.init === 'function') {
      try {
        module.init();
        console.log(`[SIPANDU] ${name} initialized`);
      } catch (err) {
        console.error(
          `[SIPANDU] ${name} initialization failed:`,
          err
        );
      }
    }
  }

  safeInit(
    'Dashboard',
    typeof Dashboard !== 'undefined' ? Dashboard : null
  );

  safeInit(
    'Calibration',
    typeof Calibration !== 'undefined' ? Calibration : null
  );

  safeInit(
    'Control',
    typeof Control !== 'undefined' ? Control : null
  );

  safeInit(
    'Camera',
    typeof Camera !== 'undefined' ? Camera : null
  );

  safeInit(
    'DataModule',
    typeof DataModule !== 'undefined' ? DataModule : null
  );

  // ==========================================
  // 7. START REALTIME SENSOR POLLING
  // ==========================================

  if (
    typeof Realtime !== 'undefined' &&
    typeof Realtime.start === 'function'
  ) {
    Realtime.start();
    console.log('[SIPANDU] Realtime polling started');
  } else {
    console.error('[SIPANDU] Realtime module not found');
  }

  console.log('[SIPANDU] Web Admin ready');
});
