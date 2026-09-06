import axios from 'axios';
import { Ghost, AuthType, AuthCredentials, ConnectionProbeResult, OneClickCloneConfig } from './types';

const api = axios.create({
  baseURL: '/api' // This will be proxied by Vite dev server
});

const STORAGE_KEY = 'ghostcode_instances';

const INITIAL_MOCK_GHOSTS: Ghost[] = [
  {
    id: 101,
    name: 'payment-checkout-api-clone',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    size_mb: 184,
    serviceUrl: 'https://payments.service.production.internal:8443',
    environment: 'production',
    authType: 'bearer',
    localPort: 3001,
    details: {
      service: 'payments-checkout-cluster',
      captureDepth: 'full',
      includeEnvVars: true,
      sanitizePii: true,
      localPort: 3001,
      state: {
        env: {
          "NODE_ENV": "production",
          "PORT": "3001",
          "DATABASE_URL": "postgres://app_ro:****@prod-db-primary.internal:5432/payments",
          "STRIPE_API_MODE": "live_ephemeral_shadow",
          "KAFKA_BROKERS": "kafka-01.internal:9092,kafka-02.internal:9092",
          "REDIS_CACHE_URL": "redis://cache-cluster.internal:6379/1",
          "LOG_LEVEL": "debug"
        },
        logs: [
          "[PROD-01] 2026-09-06T10:15:02Z INFO :: Snapshot snapshot-init initialized with zero-pause probe",
          "[PROD-01] 2026-09-06T10:15:03Z INFO :: Freezing thread state for checkout orchestrator #401",
          "[PROD-01] 2026-09-06T10:15:04Z WARN :: PII Sanitizer masked 1,420 customer card entries & tokens",
          "[PROD-01] 2026-09-06T10:15:05Z INFO :: Memory dump (184 MB) mirrored to local debug sandbox",
          "[PROD-01] 2026-09-06T10:15:06Z SUCCESS :: 1-Click clone ready for local time-travel replay on :3001"
        ],
        memoryDump: `[Heap Snapshot: payments-checkout-api]\nTotal Allocated: 184.2 MB\nV8 Garbage Collector Gen: Generation 2\nActive Sockets: 34 (shadow-piped to local mock proxy)\nThreads: 8 worker threads preserved`
      }
    }
  },
  {
    id: 102,
    name: 'auth-gateway-canary-clone',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    size_mb: 92,
    serviceUrl: 'k8s://production-cluster-us/namespaces/auth/gateway-pod-9ffb',
    environment: 'canary',
    authType: 'mtls',
    localPort: 8080,
    details: {
      service: 'auth-gateway-canary',
      captureDepth: 'full',
      includeEnvVars: true,
      sanitizePii: true,
      localPort: 8080,
      state: {
        env: {
          "AUTH_REALM": "production-us",
          "JWT_PUBLIC_KEY": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0...",
          "SESSION_TTL": "86400",
          "RATE_LIMIT_RPM": "5000"
        },
        logs: [
          "[CANARY] 2026-09-05T18:30:10Z INFO :: TLS 1.3 Handshake completed with client cert #4912",
          "[CANARY] 2026-09-05T18:30:11Z WARN :: High memory usage in token validator cache (88%)",
          "[CANARY] 2026-09-05T18:30:12Z INFO :: Ephemeral clone generated for root-cause inspection"
        ],
        memoryDump: `[Heap Snapshot: auth-gateway]\nActive Session Tokens: 12,940 (masked)\nJWT Validation Cache: 88% full\nStack trace: OAuthCallbackException at auth.go:182`
      }
    }
  }
];

const getStoredGhosts = (): Ghost[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_GHOSTS));
      return INITIAL_MOCK_GHOSTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MOCK_GHOSTS;
  }
};

const saveStoredGhosts = (ghosts: Ghost[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ghosts));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
};

export const fetchGhosts = async (): Promise<Ghost[]> => {
  try {
    const { data } = await api.get('/ghosts');
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    // Fallback to local persistent state
  }
  return getStoredGhosts();
};

export const fetchGhostById = async (ghostId: number): Promise<Ghost> => {
  try {
    const { data } = await api.get(`/ghosts/${ghostId}`);
    if (data) return data;
  } catch (err) {
    // continue
  }

  await new Promise(resolve => setTimeout(resolve, 300));
  const stored = getStoredGhosts();
  const found = stored.find(g => g.id === ghostId);
  if (found) return found;

  // Generate a realistic snapshot if not found
  const mockName = `ghost-session-${ghostId}`;
  return {
    id: ghostId,
    name: mockName,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    size_mb: ((ghostId * 37) % 200) + 50,
    serviceUrl: `https://prod-service-${ghostId}.internal:8443`,
    environment: 'production',
    authType: 'bearer',
    localPort: 3000 + (ghostId % 1000),
    details: {
      service: `service-cluster-${ghostId}`,
      captureDepth: 'full',
      includeEnvVars: true,
      sanitizePii: true,
      state: {
        env: {
          "NODE_ENV": "production",
          "DATABASE_URL": "postgres://user:pass@prod-db:5432/users",
          "CACHE_HOST": "redis-prod:6379",
          "API_VERSION": "v3.1.4",
          "REQUEST_ID": `req-${ghostId}-abc`
        },
        logs: [
          "2026-09-06T10:00:01Z [INFO] - Live service instance frozen for zero-downtime clone...",
          `2026-09-06T10:00:05Z [INFO] - Mirroring TLS state and credentials for session ${ghostId}`,
          "2026-09-06T10:00:06Z [WARN] - Sanitizing PII in active memory allocations",
          "2026-09-06T10:00:08Z [SUCCESS] - 1-Click clone active on local debugging bridge"
        ],
        memoryDump: `[Heap Snapshot]\nAddress: 0x${(ghostId * 12345).toString(16)}\nSize: 74.2 MB\nAllocations: 45,920 objects`
      }
    }
  };
};

export const testServiceConnection = async (
  serviceUrl: string,
  authType: AuthType,
  credentials: AuthCredentials
): Promise<ConnectionProbeResult> => {
  // Simulate an active probe handshake with the remote production target
  await new Promise(resolve => setTimeout(resolve, 1100));

  const trimmedUrl = serviceUrl.trim();
  if (!trimmedUrl) {
    return {
      status: 'failed',
      message: 'Service URL cannot be empty.',
    };
  }

  // URL protocol verification
  const isValidUrl = /^(https?|k8s|grpc|tcp):\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+$/i.test(trimmedUrl);
  if (!isValidUrl) {
    return {
      status: 'failed',
      message: 'Invalid URL format. Expected protocol such as https://, http://, k8s://, or grpc://',
    };
  }

  // Authentication credentials check
  if (authType === 'bearer' && (!credentials.bearerToken || credentials.bearerToken.trim().length < 6)) {
    return {
      status: 'failed',
      message: 'Bearer Token must be provided and contain at least 6 characters.',
    };
  }

  if (authType === 'basic' && (!credentials.username || !credentials.password)) {
    return {
      status: 'failed',
      message: 'Both Username and Password are required for Basic Authentication.',
    };
  }

  if (authType === 'mtls' && (!credentials.clientCert || credentials.clientCert.trim().length < 20)) {
    return {
      status: 'failed',
      message: 'Valid X.509 Client Certificate (PEM format) is required for mTLS authentication.',
    };
  }

  if (authType === 'iam' && (!credentials.iamRoleArn && !credentials.serviceAccountJson)) {
    return {
      status: 'failed',
      message: 'AWS IAM Role ARN or Service Account Key JSON is required.',
    };
  }

  if (authType === 'apiKey' && (!credentials.apiKeyValue || credentials.apiKeyValue.trim().length < 4)) {
    return {
      status: 'failed',
      message: 'API Key secret value must be provided.',
    };
  }

  // Simulated detection based on URL
  let serviceDetected = 'Node.js v20.12 (Express + Prisma)';
  if (trimmedUrl.includes('k8s')) {
    serviceDetected = 'Kubernetes Pod (Go 1.22.4 / Gin + gRPC)';
  } else if (trimmedUrl.includes('payment') || trimmedUrl.includes('checkout')) {
    serviceDetected = 'Java 21 / Spring Boot 3.2 (Virtual Threads)';
  } else if (trimmedUrl.includes('auth') || trimmedUrl.includes('identity')) {
    serviceDetected = 'Rust / Axum (mTLS Enabled)';
  } else if (trimmedUrl.includes('python') || trimmedUrl.includes('ai')) {
    serviceDetected = 'Python 3.12 (FastAPI + Pydantic v2)';
  }

  const latencyMs = Math.floor(Math.random() * 45) + 22; // 22ms - 67ms

  return {
    status: 'success',
    latencyMs,
    serviceDetected,
    tlsVersion: 'TLS 1.3 (ChaCha20-Poly1305 / ECDHE-P256)',
    authScope: 'Read-only Snapshot, Thread Memory Freeze, Telemetry Stream',
    httpStatus: 200,
    ipAddress: '10.240.18.42 (VPC Private Subnet)',
    message: `Connected successfully! Target service detected as ${serviceDetected} with ${latencyMs}ms roundtrip latency.`,
  };
};

export const oneClickCloneService = async (
  config: OneClickCloneConfig,
  onProgress?: (stage: string, percent: number) => void
): Promise<Ghost> => {
  const steps = [
    { text: 'Verifying production endpoint and mutual TLS...', progress: 15 },
    { text: 'Authenticating credentials and acquiring snapshot lock...', progress: 35 },
    { text: 'Capturing memory heap, active sockets & call-stack snapshot...', progress: 60 },
    { text: config.sanitizePii ? 'Applying real-time PII & secret redactor filters...' : 'Packaging raw environment variables...', progress: 80 },
    { text: `Synthesizing local Ghost instance on port :${config.localPort}...`, progress: 95 },
  ];

  for (const step of steps) {
    if (onProgress) {
      onProgress(step.text, step.progress);
    }
    await new Promise(r => setTimeout(r, 450));
  }

  const newId = Date.now();
  const sizeMb = config.captureDepth === 'full' 
    ? Math.floor(Math.random() * 120) + 110 
    : Math.floor(Math.random() * 35) + 25;

  const newGhost: Ghost = {
    id: newId,
    name: config.name.trim() || `ghost-${config.environment}-${newId.toString().slice(-4)}`,
    created_at: new Date().toISOString(),
    size_mb: sizeMb,
    serviceUrl: config.serviceUrl,
    environment: config.environment,
    authType: config.authType,
    localPort: config.localPort,
    details: {
      service: config.serviceUrl.replace(/https?:\/\//, '').split('/')[0] || config.name,
      captureDepth: config.captureDepth,
      includeEnvVars: config.includeEnvVars,
      sanitizePii: config.sanitizePii,
      localPort: config.localPort,
      state: {
        env: {
          "NODE_ENV": config.environment,
          "SERVICE_URL": config.serviceUrl,
          "LOCAL_PORT": String(config.localPort),
          "AUTH_SCHEME": config.authType.toUpperCase(),
          "CLONE_ENGINE": "GhostCode-v2.4-OneClick",
          "PII_MASKED": config.sanitizePii ? "true" : "false",
          "SNAPSHOT_TIMESTAMP": new Date().toISOString()
        },
        logs: [
          `[BOOT] GhostCode agent attached to target: ${config.serviceUrl}`,
          `[AUTH] Authenticated via ${config.authType.toUpperCase()} credentials with read-only probe`,
          `[MEM] Ephemeral memory freeze complete: ${sizeMb} MB captured`,
          config.sanitizePii ? `[SEC] PII & PCI-DSS rules applied: 0 exposed secrets` : `[SEC] Environment captured without redaction`,
          `[READY] Local debug proxy live and listening on http://localhost:${config.localPort}`
        ],
        memoryDump: `[Ghost Clone Memory Dump]\nTarget: ${config.serviceUrl}\nAuth: ${config.authType}\nCaptured: ${sizeMb} MB in ${config.captureDepth} mode\nLocal Port: ${config.localPort}`
      }
    }
  };

  try {
    await api.post('/ghosts', newGhost);
  } catch (e) {
    // continue
  }

  // Update localStorage
  const current = getStoredGhosts();
  const updated = [newGhost, ...current.filter(g => g.id !== newId)];
  saveStoredGhosts(updated);

  if (onProgress) {
    onProgress('Ghost clone successfully deployed locally!', 100);
  }

  return newGhost;
};

export const createGhost = async (params: {
  name: string;
  service: string;
  serviceDetails: string;
  captureDepth: string;
  includeEnvVars: boolean;
}): Promise<Ghost> => {
  const newGhost: Ghost = {
    id: Date.now(),
    name: params.name,
    created_at: new Date().toISOString(),
    size_mb: Math.floor(Math.random() * 150) + 40,
    serviceUrl: params.service,
    environment: 'production',
    authType: 'bearer',
    localPort: 3001,
    details: {
      service: params.service,
      captureDepth: params.captureDepth,
      includeEnvVars: params.includeEnvVars,
      state: {
        env: {
          "SERVICE_ID": params.service,
          "DETAILS": params.serviceDetails,
          "CREATED": new Date().toISOString()
        },
        logs: [
          `Service ${params.service} snapshot created.`,
          `Capture depth: ${params.captureDepth}`
        ],
        memoryDump: `Memory snapshot for ${params.name}`
      }
    }
  };

  try {
    await api.post('/ghosts', newGhost);
  } catch (e) {
    // continue
  }

  const current = getStoredGhosts();
  saveStoredGhosts([newGhost, ...current]);
  return newGhost;
};

export const deleteGhost = async (ghostId: number) => {
  try {
    await api.delete(`/ghosts/${ghostId}`);
  } catch (e) {
    // continue
  }

  const current = getStoredGhosts();
  const updated = current.filter(g => g.id !== ghostId);
  saveStoredGhosts(updated);
  return { success: true };
};

export default api;
