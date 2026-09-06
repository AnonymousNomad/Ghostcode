export type AuthType = 'bearer' | 'basic' | 'mtls' | 'iam' | 'apiKey';
export type EnvironmentType = 'production' | 'staging' | 'canary';

export interface AuthCredentials {
  bearerToken?: string;
  username?: string;
  password?: string;
  clientCert?: string;
  clientKey?: string;
  caCert?: string;
  headerName?: string;
  apiKeyValue?: string;
  iamRoleArn?: string;
  serviceAccountJson?: string;
}

export interface ConnectionProbeResult {
  status: 'idle' | 'testing' | 'success' | 'failed';
  latencyMs?: number;
  serviceDetected?: string;
  tlsVersion?: string;
  authScope?: string;
  message?: string;
  httpStatus?: number;
  ipAddress?: string;
}

export interface OneClickCloneConfig {
  name: string;
  serviceUrl: string;
  environment: EnvironmentType;
  authType: AuthType;
  credentials: AuthCredentials;
  captureDepth: 'full' | 'shallow';
  includeEnvVars: boolean;
  sanitizePii: boolean;
  localPort: number;
  mockExternalApis: boolean;
}

export interface Ghost {
  id: number;
  name: string;
  created_at: string;
  size_mb: number;
  serviceUrl?: string;
  environment?: EnvironmentType;
  authType?: AuthType;
  localPort?: number;
  details?: {
    service: string;
    captureDepth: string;
    includeEnvVars: boolean;
    sanitizePii?: boolean;
    localPort?: number;
    state: {
      env: Record<string, string>;
      logs: string[];
      memoryDump: string;
    }
  }
}
