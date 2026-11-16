
 // realtime.js — HTTP polling for real-time sensor data
'use strict';

const Realtime = (() => {
  let _intervalId = null;
  let _isConnected = false;
  let _lastDataMs = null;
  let _staleMs = 10000;
  let _polling = false;

  const _listeners = {
    status: [],
    sensors: [],
    connection: []
  };

  function _emit(event, data) {
    (_listeners[event] || []).forEach(fn => {
      try {
        fn(data);
      } catch (e) {
        console.error(`[Realtime] Listener ${event} error:`, e);
      }
    });
  }

  function _setConnected(val) {
    if (_isConnected !== val) {
      _isConnected = val;
      _emit('connection', val);
    }
  }

  function _isValidSensorResponse(data) {
    return !!(
      data &&
      data.sensors &&
      typeof data.sensors === 'object' &&
      !Array.isArray(data.sensors)
    );
  }

  async function _poll() {
    if (_polling) return;
    _polling = true;

    try {
      const [status, sensors] = await Promise.all([
        ESP32API.getStatus(),
        ESP32API.getSensors()
      ]);

      if (!_isValidSensorResponse(sensors)) {
        throw new Error('Respons sensor tidak valid atau kosong');
      }

      _lastDataMs = Date.now();

      // Pastikan status koneksi sudah aktif sebelum dashboard
      // menerima pembacaan sensor.
      _setConnected(true);

      _emit('status', status);
      _emit('sensors', sensors);

    } catch (err) {
      _setConnected(false);
      _emit('sensors', null);

      console.warn('[Realtime] Poll failed:', err.message);

    } finally {
      _polling = false;
    }
  }

  function _checkStale() {
    if (
      _isConnected &&
      _lastDataMs &&
      Date.now() - _lastDataMs > _staleMs
    ) {
      _setConnected(false);
      _emit('sensors', null);

      console.warn('[Realtime] Sensor data stale');
    }
  }

  return {
    start() {
      if (_intervalId) return;

      _poll();

      const interval =
        typeof ESP32Config !== 'undefined' &&
        Number.isFinite(Number(ESP32Config.updateInterval))
          ? Number(ESP32Config.updateInterval)
          : 2000;

      _intervalId = setInterval(() => {
        _checkStale();
        _poll();
      }, interval);

      console.log(
        '[Realtime] Polling started, interval:',
        interval,
        'ms'
      );
    },

    stop() {
      if (_intervalId) {
        clearInterval(_intervalId);
        _intervalId = null;
      }
    },

    restart() {
      this.stop();
      this.start();
    },

    isConnected() {
      return _isConnected;
    },

    lastDataMs() {
      return _lastDataMs;
    },

    on(event, fn) {
      if (_listeners[event] && typeof fn === 'function') {
        _listeners[event].push(fn);
      }
    },

    off(event, fn) {
      if (_listeners[event]) {
        _listeners[event] = _listeners[event].filter(f => f !== fn);
      }
    }
  };
})();

window.Realtime = Realtime;
