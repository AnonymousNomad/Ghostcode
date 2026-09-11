/**
 * GhostCode sidecar — capture agent (CJS).
 *
 * The CJS version of sidecar.mjs for require()ing from integration tests.
 * Same behavior. Same code, different module format.
 *
 * Public entry: const { enable } = require('ghostcode-sidecar');
 */

const { randomUUID } = require('node:crypto');
const { writeFileSync, appendFileSync, existsSync } = require('node:fs');

const DEFAULTS = {
  vault: './ghost-vault.jsonl',
  scrub: true,
  maxBodyBytes: 64 * 1024,
  rules: null,
};

let _state = null;

function enable(opts) {
  if (opts === undefined) opts = {};
  if (_state && _state.enabled) return;
  const config = Object.assign({}, DEFAULTS, opts);
  _state = {
    enabled: true,
    config,
    startedAt: Date.now(),
    events: [],
    counts: { requests: 0, errors: 0 },
  };

  if (!existsSync(config.vault)) {
    writeFileSync(config.vault, '');
  }

  installHttpPatch(config);
  installErrorHandlers(config);

  appendEvent(config.vault, {
    type: 'session_start',
    at: Date.now(),
    pid: process.pid,
    env: redactEnv(scrubIfEnabled(process.env, config)),
  });

  return {
    stop: function () { stop(config); },
    stats: function () { return Object.assign({}, _state.counts, { events: _state.events.length }); },
  };
}

function installHttpPatch(config) {
  const http = require('node:http');
  const https = require('node:https');
  patch(http, config, 'http');
  patch(https, config, 'https');
}

function patch(mod, config, scheme) {
  const origRequest = mod.request;
  mod.request = function patchedRequest() {
    const args = Array.prototype.slice.call(arguments);
    const req = origRequest.apply(this, args);
    const id = randomUUID();
    const startedAt = Date.now();
    let url, method, headers;
    try {
      if (typeof args[0] === 'string' || args[0] instanceof URL) {
        url = String(args[0]);
        const opt = args[1] || {};
        method = opt.method || 'GET';
        headers = opt.headers || {};
      } else {
        const opt = args[0] || {};
        url = opt.path || (opt.hostname ? opt.hostname + (opt.path || '') : '?');
        method = opt.method || 'GET';
        headers = opt.headers || {};
      }
    } catch (e) {
      url = '?'; method = '?'; headers = {};
    }
    captureEvent(config, {
      type: 'http_request', id: id, scheme: scheme, method: method, url: url,
      headers: scrubIfEnabled(headers, config),
      at: startedAt,
    });
    _state.counts.requests++;

    req.on('response', function (res) {
      const resChunks = [];
      res.on('data', function (c) { resChunks.push(c); });
      res.on('end', function () {
        const body = Buffer.concat(resChunks);
        captureEvent(config, {
          type: 'http_response', id: id, status: res.statusCode,
          headers: scrubIfEnabled(res.headers, config),
          bodyPreview: previewBody(body, config.maxBodyBytes),
          bodySize: body.length,
          latencyMs: Date.now() - startedAt,
          at: Date.now(),
        });
      });
    });
    req.on('error', function (e) {
      captureEvent(config, {
        type: 'http_error', id: id, error: e.message, code: e.code,
        at: Date.now(),
      });
    });
    return req;
  };

  if (mod.createServer) {
    const origCreate = mod.createServer;
    mod.createServer = function patchedCreateServer() {
      const args = Array.prototype.slice.call(arguments);
      const server = origCreate.apply(this, args);
      server.on('request', function (req, res) {
        const id = randomUUID();
        const startedAt = Date.now();
        const reqChunks = [];
        req.on('data', function (c) { reqChunks.push(c); });
        req.on('end', function () {
          captureEvent(config, {
            type: 'inbound_request', id: id,
            method: req.method, url: req.url,
            headers: scrubIfEnabled(req.headers, config),
            bodyPreview: previewBody(Buffer.concat(reqChunks), config.maxBodyBytes),
            at: startedAt,
          });
        });
        res.on('finish', function () {
          captureEvent(config, {
            type: 'inbound_response', id: id,
            status: res.statusCode,
            headers: scrubIfEnabled((res.getHeaders && res.getHeaders()) || {}, config),
            latencyMs: Date.now() - startedAt,
            at: Date.now(),
          });
        });
      });
      return server;
    };
  }
}

function installErrorHandlers(config) {
  process.on('uncaughtException', function (err) {
    _state.counts.errors++;
    captureEvent(config, {
      type: 'uncaught_exception',
      name: err.name,
      message: scrubIfEnabled(err.message, config),
      stack: scrubIfEnabled(err.stack, config),
      at: Date.now(),
    });
  });
  process.on('unhandledRejection', function (reason) {
    _state.counts.errors++;
    captureEvent(config, {
      type: 'unhandled_rejection',
      reason: scrubIfEnabled(String(reason), config),
      at: Date.now(),
    });
  });
}

function captureEvent(config, ev) {
  if (!_state) return;
  _state.events.push(ev);
  appendEvent(config.vault, ev);
}

function appendEvent(vault, ev) {
  try {
    appendFileSync(vault, JSON.stringify(ev) + '\n');
  } catch (e) {
    console.error('[ghostcode] vault write failed:', e.message);
  }
}

function previewBody(buf, max) {
  if (!buf || !buf.length) return '';
  const sliced = buf.length > max ? buf.subarray(0, max) : buf;
  return sliced.toString('utf8');
}

function redactEnv(env) {
  const REDACT_KEYS = /secret|token|key|password|pass|auth|credential/i;
  const out = {};
  for (const k of Object.keys(env)) {
    if (REDACT_KEYS.test(k)) out[k] = '[REDACTED]';
    else out[k] = env[k];
  }
  return out;
}

function scrubIfEnabled(value, config) {
  if (!config.scrub) return value;
  return getInlineShield().scrubObject(value, config.rules || getInlineShield().DEFAULT_RULES);
}

function getInlineShield() {
  const BUILTIN = {
    email:       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    creditCard:  /\b(?:\d[ -]*?){13,19}\b/g,
    bearerToken: /\bBearer\s+[A-Za-z0-9._\-]{20,}/g,
    apiToken:    /\b(?:sk-|ghp_|gho_|ghu_|ghs_|ghr_|xox[abp]-)[A-Za-z0-9]{20,}/g,
    phoneE164:   /\+[1-9]\d{1,14}\b/g,
    ssn:         /\b\d{3}-\d{2}-\d{4}\b/g,
  };
  const DEFAULT_RULES = [
    { id: 'r-email',  pattern: 'email',       mask: '[EMAIL]', enabled: true },
    { id: 'r-cc',     pattern: 'creditCard',  mask: '[CC]',    enabled: true },
    { id: 'r-bearer', pattern: 'bearerToken', mask: '[TOKEN]', enabled: true },
    { id: 'r-api',    pattern: 'apiToken',    mask: '[API]',   enabled: true },
    { id: 'r-phone',  pattern: 'phoneE164',   mask: '[PHONE]', enabled: true },
    { id: 'r-ssn',    pattern: 'ssn',         mask: '[SSN]',   enabled: true },
  ];
  function luhnValid(s) {
    const c = s.replace(/\D/g, '');
    if (c.length < 13 || c.length > 19) return false;
    let sum = 0, alt = false;
    for (let i = c.length - 1; i >= 0; i--) {
      let n = c.charCodeAt(i) - 48;
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }
  function scrubString(s, rules) {
    let out = s;
    for (const r of rules) {
      if (!r.enabled) continue;
      const re = BUILTIN[r.pattern];
      if (!re) continue;
      out = out.replace(re, function (m) {
        if (r.pattern === 'creditCard' && !luhnValid(m)) return m;
        return r.mask;
      });
    }
    return out;
  }
  function scrubObject(v, rules) {
    if (typeof v === 'string') return scrubString(v, rules);
    if (Array.isArray(v)) return v.map(function (x) { return scrubObject(x, rules); });
    if (v && typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v)) out[k] = scrubObject(v[k], rules);
      return out;
    }
    return v;
  }
  return { scrubString: scrubString, scrubObject: scrubObject, DEFAULT_RULES: DEFAULT_RULES };
}

function stop(config) {
  if (!_state) return;
  appendEvent(config.vault, {
    type: 'session_end',
    at: Date.now(),
    counts: Object.assign({}, _state.counts),
  });
  _state = null;
}

module.exports = { enable: enable };
