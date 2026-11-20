
// dashboard.js — Home page logic (sensor display + offline last-known data)
'use strict';

const THRESHOLDS = {
  ph: {
    warn_lo: 6.5, crit_lo: 6.0,
    warn_hi: 8.5, crit_hi: 9.0,
    unit: ''
  },
  do_mg_l: {
    warn_lo: 4.0, crit_lo: 3.0,
    warn_hi: 14.0, crit_hi: 20.0,
    unit: 'mg/L'
  },
  tds_ppm: {
    warn_hi: 800, crit_hi: 1200,
    unit: 'ppm'
  },
  turbidity_ntu: {
    warn_hi: 50, crit_hi: 100,
    unit: 'NTU'
  },
  temperature_c: {
    warn_lo: 22, crit_lo: 18,
    warn_hi: 32, crit_hi: 35,
    unit: '°C'
  },
  battery_voltage: {
    warn_lo: 11.5, crit_lo: 11.0,
    warn_hi: 14.0, crit_hi: 15.0,
    unit: 'V'
  }
};

const LAST_DATA_KEY = 'sipandu_last_sensor_data_v1';

const SENSOR_DEFS = [
  { id: 'ph', key: 'ph', label: 'pH', unit: '', decimals: 2, hwKey: 'ads_a' },
  { id: 'do', key: 'do_mg_l', label: 'DO', unit: 'mg/L', decimals: 2, hwKey: 'ads_a' },
  { id: 'tds', key: 'tds_ppm', label: 'TDS', unit: 'ppm', decimals: 0, hwKey: 'ads_b' },
  { id: 'turbidity', key: 'turbidity_ntu', label: 'Turbidity', unit: 'NTU', decimals: 1, hwKey: 'ads_b' },
  { id: 'temperature', key: 'temperature_c', label: 'Suhu', unit: '°C', decimals: 1, hwKey: 'ds18b20' },
  { id: 'battery', key: 'battery_voltage', label: 'Baterai', unit: 'V', decimals: 2, hwKey: 'ina226' }
];

let _cachedLastData = null;
let _dashboardInitialized = false;

function isValidNumber(value) {
  return value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(Number(value));
}

function hasValidSensorData(sensors) {
  if (!sensors || typeof sensors !== 'object' || Array.isArray(sensors)) {
    return false;
  }

  return SENSOR_DEFS.some(sensor =>
    isValidNumber(sensors[sensor.key])
  );
}

function loadLastData() {
 async function loadPublishedLastData() {
  try {
    const response = await fetch(
      `data/latest-data.json?t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) return;

    const published = await response.json();

    if (
      !published ||
      !isValidNumber(published.receivedAt) ||
      !hasValidSensorData(published.sensors)
    ) return;

    if (
      !_cachedLastData ||
      Number(published.receivedAt) >
      Number(_cachedLastData.receivedAt)
    ) {
      _cachedLastData = published;

      updateSensorCards(
        published.sensors,
        published.sensor_status || {},
        false
      );

      updateLastUpdate(published.receivedAt);
      renderLastDataInfo(false);
    }

  } catch (err) {
    console.warn('[Dashboard] Data publik belum tersedia:', err);
  }
} 
try {
    const raw = localStorage.getItem(LAST_DATA_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      !isValidNumber(parsed.receivedAt) ||
      !hasValidSensorData(parsed.sensors)
    ) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[Dashboard] Gagal membaca cache sensor:', err);
    return null;
  }
}

function saveLastData(data) {
  _cachedLastData = data;

  try {
    localStorage.setItem(LAST_DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[Dashboard] Gagal menyimpan cache sensor:', err);
  }
}

function formatLastReceived(timestamp) {
  if (!isValidNumber(timestamp)) {
    return 'Belum ada data tersimpan';
  }

  return new Date(Number(timestamp)).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function getSensorStatus(key, val) {
  const threshold = THRESHOLDS[key];

  if (!threshold || !isValidNumber(val)) return 'normal';

  const value = Number(val);

  if (
    (threshold.crit_lo !== undefined && value <= threshold.crit_lo) ||
    (threshold.crit_hi !== undefined && value >= threshold.crit_hi)
  ) {
    return 'danger';
  }

  if (
    (threshold.warn_lo !== undefined && value <= threshold.warn_lo) ||
    (threshold.warn_hi !== undefined && value >= threshold.warn_hi)
  ) {
    return 'warning';
  }

  return 'normal';
}

function buildSensorCards() {
  const grid = document.getElementById('sensor-grid');

  if (!grid) {
    console.error('[Dashboard] Elemen #sensor-grid tidak ditemukan di index.html');
    return false;
  }

  grid.innerHTML = SENSOR_DEFS.map(sensor => `
    <div class="sensor-card" id="sc-${sensor.id}">
      <div class="sensor-card-top">
        <span class="sensor-name">${sensor.label}</span>
        <span class="sensor-indicator" id="si-${sensor.id}"></span>
      </div>

      <div class="sensor-value-wrap">
        <span class="sensor-value" id="sv-${sensor.id}">—</span>
        <span class="sensor-unit">${sensor.unit}</span>
      </div>

      <span class="sensor-badge badge-offline" id="sb-${sensor.id}">
        Belum ada data
      </span>
    </div>
  `).join('');

  return true;
}

function updateSensorCards(sensorData, sensorStatus, isConnected) {
  SENSOR_DEFS.forEach(sensor => {
    const valEl = document.getElementById(`sv-${sensor.id}`);
    const indEl = document.getElementById(`si-${sensor.id}`);
    const badgeEl = document.getElementById(`sb-${sensor.id}`);

    if (!valEl || !indEl || !badgeEl) return;

    const value = sensorData ? sensorData[sensor.key] : null;
    const hwOK = sensorStatus
      ? !!sensorStatus[sensor.hwKey]
      : false;

    if (!isValidNumber(value)) {
      valEl.textContent = '—';
      indEl.className = 'sensor-indicator error';
      badgeEl.className = 'sensor-badge badge-offline';
      badgeEl.textContent = 'Belum ada data';
      return;
    }

    valEl.textContent = Number(value).toFixed(sensor.decimals);

    if (!isConnected) {
      indEl.className = 'sensor-indicator';
      badgeEl.className = 'sensor-badge badge-offline';
      badgeEl.textContent = 'Data terakhir';
      return;
    }

    indEl.className = 'sensor-indicator ' + (hwOK ? 'ok' : 'error');

    const status = getSensorStatus(sensor.key, value);

    const badgeMap = {
      normal: ['badge-normal', 'Normal'],
      warning: ['badge-warning', 'Peringatan'],
      danger: ['badge-danger', 'Kritis']
    };

    const [className, label] = badgeMap[status];

    badgeEl.className = `sensor-badge ${className}`;
    badgeEl.textContent = label;
  });
}

function renderLastDataInfo(isConnected) {
  const timeEl = document.getElementById('last-data-time');
  const stateEl = document.getElementById('last-data-state');
  const noteEl = document.getElementById('last-data-note');

  if (timeEl) {
    timeEl.textContent = _cachedLastData
      ? formatLastReceived(_cachedLastData.receivedAt)
      : 'Belum ada data yang berhasil diterima';
  }

  if (stateEl) {
    stateEl.textContent = isConnected
      ? 'ONLINE — koneksi perangkat aktif'
      : _cachedLastData
        ? 'OFFLINE — menampilkan data terakhir'
        : 'OFFLINE — belum ada data tersimpan';
  }

  if (noteEl) {
    noteEl.textContent = !isConnected && _cachedLastData
      ? 'Nilai sensor di bawah adalah pembacaan terakhir yang tersimpan, bukan kondisi air saat ini.'
      : isConnected
        ? 'Koneksi ESP32 aktif. Nilai akan diperbarui saat pembacaan sensor diterima.'
        : 'Hubungkan perangkat untuk mulai menerima data sensor.';
  }
}

function updateESP32Status(statusData, isConnected) {
  const badge = document.getElementById('conn-badge');
  const badgeText = document.getElementById('conn-badge-text');
  const ipEl = document.getElementById('header-ip');
  const uptimeEl = document.getElementById('esp-uptime');

  if (badge) {
    badge.className = `connection-badge ${isConnected ? 'online' : 'offline'}`;
  }

  if (badgeText) {
    badgeText.textContent = isConnected ? 'ESP32 Online' : 'ESP32 Offline';
  }

  if (ipEl) {
    ipEl.textContent = isConnected && statusData
      ? statusData.ip_address || '—'
      : '—';
  }

  if (uptimeEl) {
    uptimeEl.textContent = isConnected && statusData
      ? 'Uptime: ' + Utils.fmtUptime(statusData.uptime_ms)
      : 'Offline';
  }

  const alert = document.getElementById('offline-alert');

  if (alert) {
    alert.classList.toggle('hidden', isConnected);
  }
}

function updateLastUpdate(timestamp) {
  const el = document.getElementById('last-update');

  if (!el) return;

  el.textContent = isValidNumber(timestamp)
    ? 'Data: ' + Utils.fmtTime(Number(timestamp))
    : 'Belum ada data';
}

const MAX_HISTORY = 20;
const _history = {};

SENSOR_DEFS.forEach(sensor => {
  _history[sensor.key] = [];
});

function pushHistory(sensorData) {
  if (!sensorData) return;

  SENSOR_DEFS.forEach(sensor => {
    const value = sensorData[sensor.key];

    if (isValidNumber(value)) {
      _history[sensor.key].push(Number(value));

      if (_history[sensor.key].length > MAX_HISTORY) {
        _history[sensor.key].shift();
      }
    }
  });
}

function initDashboard() {
  if (_dashboardInitialized) return;

  _dashboardInitialized = true;

  buildSensorCards();

  _cachedLastData = loadLastData();
loadPublishedLastData();

  if (_cachedLastData) {
    updateSensorCards(
      _cachedLastData.sensors,
      _cachedLastData.sensor_status,
      false
    );

    updateLastUpdate(_cachedLastData.receivedAt);
  } else {
    updateSensorCards(null, null, false);
    updateLastUpdate(null);
  }

  renderLastDataInfo(false);

  Realtime.on('sensors', data => {
    if (data && hasValidSensorData(data.sensors)) {
      const snapshot = {
        receivedAt: Date.now(),
        sensors: data.sensors,
        sensor_status: data.sensor_status || {}
      };

      saveLastData(snapshot);

      const connected = Realtime.isConnected();

      updateSensorCards(
        snapshot.sensors,
        snapshot.sensor_status,
        connected
      );

      pushHistory(snapshot.sensors);
      updateLastUpdate(snapshot.receivedAt);
      renderLastDataInfo(connected);
    }
  });

  Realtime.on('status', data => {
    updateESP32Status(data, Realtime.isConnected());

    if (data && typeof Control !== 'undefined') {
      Control.syncPowerState(
        data.sensor_power,
        data.jetson_power
      );
    }
  });

  Realtime.on('connection', connected => {
    updateESP32Status(null, connected);

    updateSensorCards(
      _cachedLastData ? _cachedLastData.sensors : null,
      _cachedLastData ? _cachedLastData.sensor_status : null,
      false
    );

    renderLastDataInfo(connected);
  });
}

window.Dashboard = {
  init: initDashboard
};
