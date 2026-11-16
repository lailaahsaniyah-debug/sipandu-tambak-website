
// data.js — Sensor history persisted in this browser (localStorage)
'use strict';

const DataModule = (() => {
  let _rows = [];
  let _initialized = false;

  const MAX_ROWS = 500;
  const STORAGE_KEY = 'sipandu_sensor_history_v1';
  const RECORD_INTERVAL = 30 * 1000; // Simpan setiap 30 detik

  const COLS = [
    { key: 'ts', label: 'Waktu', fmt: v => Utils.fmtTime(v) },
    { key: 'ph', label: 'pH', fmt: v => Number(v).toFixed(2) },
    { key: 'do_mg_l', label: 'DO (mg/L)', fmt: v => Number(v).toFixed(2) },
    { key: 'tds_ppm', label: 'TDS (ppm)', fmt: v => Number(v).toFixed(0) },
    { key: 'turbidity_ntu', label: 'Turbidity (NTU)', fmt: v => Number(v).toFixed(1) },
    { key: 'temperature_c', label: 'Suhu (°C)', fmt: v => Number(v).toFixed(1) },
    { key: 'battery_voltage', label: 'Baterai (V)', fmt: v => Number(v).toFixed(2) },
    { key: 'status', label: 'Status', fmt: v => v },
  ];

  const SENSOR_KEYS = [
    'ph',
    'do_mg_l',
    'tds_ppm',
    'turbidity_ntu',
    'temperature_c',
    'battery_voltage'
  ];

  function _escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[char]);
  }

  function _isValidNumber(value) {
    return value !== null &&
      value !== undefined &&
      value !== '' &&
      Number.isFinite(Number(value));
  }

  function _statusText(sensors) {
    const ph = Number(sensors.ph);
    const turbidity = Number(sensors.turbidity_ntu);

    if (
      !_isValidNumber(sensors.ph) ||
      !_isValidNumber(sensors.turbidity_ntu)
    ) {
      return '—';
    }

    if (ph < 6.0 || ph > 9.0 || turbidity > 100) {
      return 'BAHAYA';
    }

    if (ph < 6.5 || ph > 8.5 || turbidity > 50) {
      return 'WASPADA';
    }

    return 'NORMAL';
  }

  function _loadRows() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      if (!Array.isArray(saved)) {
        _rows = [];
        return;
      }

      _rows = saved
        .filter(row =>
          row &&
          Number.isFinite(Number(row.ts)) &&
          SENSOR_KEYS.some(key => _isValidNumber(row[key]))
        )
        .slice(-MAX_ROWS);

    } catch (err) {
      console.warn('[Data] Gagal membaca riwayat lokal:', err);
      _rows = [];
    }
  }

  function _saveRows() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(_rows)
      );
    } catch (err) {
      console.warn('[Data] Gagal menyimpan riwayat lokal:', err);

      if (typeof Utils !== 'undefined' && Utils.toast) {
        Utils.toast(
          'Penyimpanan lokal penuh atau tidak tersedia',
          'error'
        );
      }
    }
  }

  function buildTable() {
    const thead = document.getElementById('data-thead');
    const tbody = document.getElementById('data-tbody');

    if (!thead || !tbody) return;

    thead.innerHTML = '<tr>' +
      COLS.map(col => `<th>${col.label}</th>`).join('') +
      '</tr>';

    _renderBody(tbody);
  }

  function _renderBody(tbody) {
    if (!tbody) {
      tbody = document.getElementById('data-tbody');
    }

    if (!tbody) return;

    const countEl = document.getElementById('data-row-count');

    if (countEl) {
      countEl.textContent =
        `${_rows.length} pembacaan tersimpan di browser ini`;
    }

    if (_rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${COLS.length}"
              class="text-center text-muted"
              style="padding:24px">
            Belum ada data tersimpan — data akan dicatat setelah
            pembacaan sensor diterima
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = [..._rows].reverse().map(row => {
      const cells = COLS.map(col => {
        const value = row[col.key];

        let formatted = '—';

        if (col.key === 'ts') {
          if (_isValidNumber(value)) {
            formatted = col.fmt(value);
          }
        } else if (col.key === 'status') {
          formatted = value || '—';
        } else if (_isValidNumber(value)) {
          formatted = col.fmt(value);
        }

        const safeValue = _escapeHTML(formatted);
        const cls = col.key === 'status'
          ? _statusCls(formatted)
          : '';

        return `<td class="${cls}">${safeValue}</td>`;
      }).join('');

      return `<tr>${cells}</tr>`;
    }).join('');
  }

  function _statusCls(status) {
    if (
      status === 'NORMAL' ||
      status === 'WASPADA' ||
      status === 'BAHAYA'
    ) {
      return 'status-val';
    }

    return '';
  }

  function addRow(sensors) {
    if (!sensors || typeof sensors !== 'object') return;

    const hasSensorData = SENSOR_KEYS.some(key =>
      _isValidNumber(sensors[key])
    );

    if (!hasSensorData) return;

    const now = Date.now();

    // Batasi pencatatan menjadi satu kali setiap 30 detik.
    // Data pertama tetap langsung dicatat.
    const lastRow = _rows[_rows.length - 1];

    if (
      lastRow &&
      now - Number(lastRow.ts) < RECORD_INTERVAL
    ) {
      return;
    }

    const row = {
      ts: now,
      ph: _isValidNumber(sensors.ph)
        ? Number(sensors.ph)
        : null,
      do_mg_l: _isValidNumber(sensors.do_mg_l)
        ? Number(sensors.do_mg_l)
        : null,
      tds_ppm: _isValidNumber(sensors.tds_ppm)
        ? Number(sensors.tds_ppm)
        : null,
      turbidity_ntu: _isValidNumber(sensors.turbidity_ntu)
        ? Number(sensors.turbidity_ntu)
        : null,
      temperature_c: _isValidNumber(sensors.temperature_c)
        ? Number(sensors.temperature_c)
        : null,
      battery_voltage: _isValidNumber(sensors.battery_voltage)
        ? Number(sensors.battery_voltage)
        : null,
      status: _statusText(sensors)
    };

    _rows.push(row);

    if (_rows.length > MAX_ROWS) {
      _rows.shift();
    }

    _saveRows();
    _renderBody();
  }

  return {
    init() {
      _loadRows();
      buildTable();

      if (_initialized) return;

      _initialized = true;

      Realtime.on('sensors', data => {
        if (data && data.sensors) {
          addRow(data.sensors);
        }
      });
    },

    refresh() {
      _renderBody();
    },

    getRows() {
      return [..._rows];
    }
  };
})();

window.DataModule = DataModule;
