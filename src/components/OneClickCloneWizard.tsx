import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  XMarkIcon,
  GlobeAltIcon,
  KeyIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  InformationCircleIcon,
  PlayIcon,
  ClipboardDocumentCheckIcon,
  LayersIcon,
} from '../constants';
import { testServiceConnection, oneClickCloneService } from '../api';
import { AuthType, EnvironmentType, AuthCredentials, ConnectionProbeResult } from '../types';
import { useToast } from '../context/ToastContext';

interface OneClickCloneWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

const PRESET_SERVICES = [
  {
    name: 'payment-checkout-prod',
    url: 'https://api.payments.prod.internal:8443',
    env: 'production' as EnvironmentType,
    authType: 'bearer' as AuthType,
    credentials: { bearerToken: 'gh_sec_prod_994827104817aa9f88c' },
    desc: 'High-throughput Stripe payment orchestrator'
  },
  {
    name: 'auth-gateway-cluster',
    url: 'k8s://prod-cluster-us/namespaces/auth/gateway-pod',
    env: 'production' as EnvironmentType,
    authType: 'mtls' as AuthType,
    credentials: {
      clientCert: '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIUQ...PROD_CERT\n-----END CERTIFICATE-----',
      clientKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w...KEY\n-----END PRIVATE KEY-----'
    },
    desc: 'OAuth2/OIDC Zero-Trust Identity Broker'
  },
  {
    name: 'order-dispatch-canary',
    url: 'https://orders-canary.internal.corp:8080/v2',
    env: 'canary' as EnvironmentType,
    authType: 'basic' as AuthType,
    credentials: { username: 'ops_engineer', password: 'EphemeralPassword#2026' },
    desc: 'Kafka Event-Driven Order Processing Worker'
  },
  {
    name: 'analytics-graphql-service',
    url: 'https://graphql.analytics.production.io/graphql',
    env: 'production' as EnvironmentType,
    authType: 'apiKey' as AuthType,
    credentials: { headerName: 'X-GhostCode-Access-Key', apiKeyValue: 'gh_live_sec_key_44129' },
    desc: 'Realtime Telemetry & Data Aggregator'
  }
];

export const OneClickCloneWizard: React.FC<OneClickCloneWizardProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Configuration State
  const [cloneName, setCloneName] = useState('checkout-service-clone');
  const [serviceUrl, setServiceUrl] = useState('https://api.payments.prod.internal:8443');
  const [environment, setEnvironment] = useState<EnvironmentType>('production');
  const [authType, setAuthType] = useState<AuthType>('bearer');
  
  // Credentials
  const [credentials, setCredentials] = useState<AuthCredentials>({
    bearerToken: 'gh_sec_prod_994827104817aa9f88c',
    username: 'ops_engineer',
    password: '',
    clientCert: '',
    clientKey: '',
    headerName: 'X-API-Key',
    apiKeyValue: '',
    iamRoleArn: 'arn:aws:iam::123456789012:role/GhostCodeCloneOperator'
  });

  // Security & Clone Specs
  const [showSecret, setShowSecret] = useState(false);
  const [captureDepth, setCaptureDepth] = useState<'full' | 'shallow'>('full');
  const [includeEnvVars, setIncludeEnvVars] = useState(true);
  const [sanitizePii, setSanitizePii] = useState(true);
  const [localPort, setLocalPort] = useState(3001);
  const [mockExternalApis, setMockExternalApis] = useState(true);

  // Connection Probe State
  const [probeResult, setProbeResult] = useState<ConnectionProbeResult>({ status: 'idle' });
  const [isTestingProbe, setIsTestingProbe] = useState(false);

  // Clone Execution State
  const [cloneProgressText, setCloneProgressText] = useState('Initializing zero-pause snapshot...');
  const [clonePercent, setClonePercent] = useState(0);
  const [createdGhostId, setCreatedGhostId] = useState<number | null>(null);
  const [copiedDebugCmd, setCopiedDebugCmd] = useState(false);

  // Mutation for 1-Click Clone
  const cloneMutation = useMutation({
    mutationFn: async () => {
      return await oneClickCloneService(
        {
          name: cloneName || 'production-service-clone',
          serviceUrl,
          environment,
          authType,
          credentials,
          captureDepth,
          includeEnvVars,
          sanitizePii,
          localPort,
          mockExternalApis
        },
        (stage, pct) => {
          setCloneProgressText(stage);
          setClonePercent(pct);
        }
      );
    },
    onSuccess: (newGhost) => {
      queryClient.invalidateQueries({ queryKey: ['ghosts'] });
      setCreatedGhostId(newGhost.id);
      addToast(`1-Click Clone created! Snapshot listening locally on port :${newGhost.localPort || localPort}`, 'success');
    },
    onError: (err: Error) => {
      addToast(`Clone failed: ${err.message}`, 'error');
    }
  });

  // Handle Testing Connection Probe
  const handleTestConnection = async () => {
    setIsTestingProbe(true);
    setProbeResult({ status: 'testing' });
    try {
      const result = await testServiceConnection(serviceUrl, authType, credentials);
      setProbeResult(result);
      if (result.status === 'success') {
        addToast('Production credentials verified & endpoint handshake succeeded!', 'success');
      } else {
        addToast(result.message || 'Connection test failed', 'error');
      }
    } catch (e) {
      setProbeResult({
        status: 'failed',
        message: 'Network probe timeout or unreachable host.'
      });
      addToast('Connection probe failed', 'error');
    } finally {
      setIsTestingProbe(false);
    }
  };

  // Preset Selection
  const applyPreset = (preset: typeof PRESET_SERVICES[0]) => {
    setCloneName(preset.name);
    setServiceUrl(preset.url);
    setEnvironment(preset.env);
    setAuthType(preset.authType);
    setCredentials(prev => ({ ...prev, ...preset.credentials }));
    setProbeResult({ status: 'idle' });
  };

  // Trigger 1-Click Clone
  const handleExecuteClone = () => {
    setCurrentStep(4);
    setClonePercent(5);
    setCloneProgressText('Establishing secure zero-overhead tunnel to production target...');
    cloneMutation.mutate();
  };

  const handleCopyDebugCmd = () => {
    const cmd = `ghostcode attach --target http://localhost:${localPort} --ghost-id ${createdGhostId || 101}`;
    navigator.clipboard?.writeText(cmd);
    setCopiedDebugCmd(true);
    setTimeout(() => setCopiedDebugCmd(false), 2500);
    addToast('Debug command copied to clipboard!', 'info');
  };

  if (!isOpen && !isEmbedded) return null;

  // Render Inner Content
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between border-b border-slate-700/80 px-6 py-4 bg-slate-900/40">
      <div className="flex items-center space-x-2 md:space-x-6 overflow-x-auto text-xs md:text-sm font-medium">
        <button
          type="button"
          onClick={() => !cloneMutation.isPending && setCurrentStep(1)}
          className={`flex items-center gap-2 pb-1 border-b-2 transition-colors whitespace-nowrap ${
            currentStep === 1
              ? 'border-cyan-500 text-cyan-400 font-semibold'
              : currentStep > 1
              ? 'border-transparent text-slate-300 hover:text-white'
              : 'border-transparent text-slate-500'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep > 1 ? 'bg-cyan-600 text-white' : currentStep === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'bg-slate-700 text-slate-400'}`}>
            1
          </span>
          <span>Target Service</span>
        </button>

        <span className="text-slate-600">/</span>

        <button
          type="button"
          onClick={() => !cloneMutation.isPending && setCurrentStep(2)}
          className={`flex items-center gap-2 pb-1 border-b-2 transition-colors whitespace-nowrap ${
            currentStep === 2
              ? 'border-cyan-500 text-cyan-400 font-semibold'
              : currentStep > 2
              ? 'border-transparent text-slate-300 hover:text-white'
              : 'border-transparent text-slate-500'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep > 2 ? 'bg-cyan-600 text-white' : currentStep === 2 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'bg-slate-700 text-slate-400'}`}>
            2
          </span>
          <span>Auth & Credentials</span>
        </button>

        <span className="text-slate-600">/</span>

        <button
          type="button"
          onClick={() => !cloneMutation.isPending && setCurrentStep(3)}
          className={`flex items-center gap-2 pb-1 border-b-2 transition-colors whitespace-nowrap ${
            currentStep === 3
              ? 'border-cyan-500 text-cyan-400 font-semibold'
              : currentStep > 3
              ? 'border-transparent text-slate-300 hover:text-white'
              : 'border-transparent text-slate-500'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep > 3 ? 'bg-cyan-600 text-white' : currentStep === 3 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'bg-slate-700 text-slate-400'}`}>
            3
          </span>
          <span>Clone Specs</span>
        </button>

        <span className="text-slate-600">/</span>

        <div
          className={`flex items-center gap-2 pb-1 border-b-2 transition-colors whitespace-nowrap ${
            currentStep === 4
              ? 'border-cyan-500 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-500'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep === 4 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'bg-slate-700 text-slate-400'}`}>
            4
          </span>
          <span>1-Click Deploy</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-xs text-cyan-400/90 font-mono bg-cyan-950/50 px-2.5 py-1 rounded-md border border-cyan-800/40">
        <SparklesIcon className="w-3.5 h-3.5" />
        <span>1-Click Zero Downtime</span>
      </div>
    </div>
  );

  return (
    <div
      className={
        isEmbedded
          ? 'bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden'
          : 'fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto'
      }
    >
      <div
        className={
          isEmbedded
            ? 'w-full'
            : 'relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-fade-in-scale'
        }
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/70 flex justify-between items-start bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  1-Click Clone Setup Wizard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live Mirror
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Target any production or staging service URL with credentials to instantiate a time-traveling local clone.
              </p>
            </div>
          </div>

          {!isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={cloneMutation.isPending}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Close Setup Wizard"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Wizard Steps Header */}
        {renderStepIndicator()}

        {/* Wizard Step Body */}
        <div className="p-6">
          {/* STEP 1: Production Service URL & Identification */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Quick presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Quick Presets (1-Click Sample Services)
                  </label>
                  <span className="text-xs text-slate-500">Click any preset to auto-populate</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {PRESET_SERVICES.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`text-left p-3 rounded-lg border text-xs transition-all ${
                        serviceUrl === p.url
                          ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-sm'
                          : 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-700/40'
                      }`}
                    >
                      <div className="font-semibold text-white truncate flex items-center justify-between">
                        <span>{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded uppercase bg-slate-700 text-slate-300 font-mono">
                          {p.authType}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1 line-clamp-1">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Clone Name */}
                <div>
                  <label htmlFor="cloneName" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Clone Instance Identifier
                  </label>
                  <div className="relative">
                    <input
                      id="cloneName"
                      type="text"
                      value={cloneName}
                      onChange={(e) => setCloneName(e.target.value)}
                      placeholder="e.g., checkout-api-debug-session"
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Label for this snapshot in your local dashboard and terminal CLI.
                  </p>
                </div>

                {/* Target Environment */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Target Environment Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['production', 'staging', 'canary'] as EnvironmentType[]).map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setEnvironment(env)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                          environment === env
                            ? env === 'production'
                              ? 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                              : env === 'canary'
                              ? 'bg-amber-950/40 border-amber-500/80 text-amber-300'
                              : 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300'
                            : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Defines security thresholds and isolation rules for the capture.
                  </p>
                </div>
              </div>

              {/* Production Service URL */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="serviceUrl" className="block text-sm font-medium text-slate-200">
                    Production Service URL or Cluster Endpoint
                  </label>
                  <span className="text-xs text-slate-400">Supports HTTPS, HTTP, K8s, gRPC</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <GlobeAltIcon className="h-5 w-5" />
                  </div>
                  <input
                    id="serviceUrl"
                    type="text"
                    value={serviceUrl}
                    onChange={(e) => {
                      setServiceUrl(e.target.value);
                      setProbeResult({ status: 'idle' });
                    }}
                    placeholder="https://service-name.internal.domain:8443 or k8s://namespace/pod-name"
                    required
                    className="w-full pl-11 pr-4 bg-slate-900/60 border border-slate-700 rounded-lg py-2.5 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <InformationCircleIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>GhostCode will connect via read-only telemetry bridge without taking the service offline.</span>
                </p>
              </div>

              {/* Action bar */}
              <div className="pt-4 border-t border-slate-700/60 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!serviceUrl.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>Continue to Credentials</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Authentication Credentials & Connection Probe */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Auth Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Authentication Scheme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'bearer', label: 'Bearer Token' },
                    { id: 'basic', label: 'Basic Auth' },
                    { id: 'mtls', label: 'mTLS / Cert' },
                    { id: 'iam', label: 'Cloud IAM' },
                    { id: 'apiKey', label: 'API Key' },
                  ].map((scheme) => (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => {
                        setAuthType(scheme.id as AuthType);
                        setProbeResult({ status: 'idle' });
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                        authType === scheme.id
                          ? 'bg-cyan-600 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700/40'
                      }`}
                    >
                      {scheme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Credentials Inputs */}
              <div className="bg-slate-900/50 border border-slate-700/80 rounded-xl p-5 space-y-4">
                {/* Bearer Token */}
                {authType === 'bearer' && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="bearerToken" className="text-sm font-medium text-slate-300">
                        Production Bearer / JWT Secret Token
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {showSecret ? (
                          <>
                            <EyeSlashIcon className="h-3.5 w-3.5" />
                            <span>Hide Token</span>
                          </>
                        ) : (
                          <>
                            <EyeIcon className="h-3.5 w-3.5" />
                            <span>Reveal Token</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyIcon className="h-5 w-5" />
                      </div>
                      <input
                        id="bearerToken"
                        type={showSecret ? 'text' : 'password'}
                        value={credentials.bearerToken || ''}
                        onChange={(e) => {
                          setCredentials({ ...credentials, bearerToken: e.target.value });
                          setProbeResult({ status: 'idle' });
                        }}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... or gh_sec_token"
                        className="w-full pl-11 pr-4 bg-slate-800 border border-slate-700 rounded-lg py-2.5 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Header format: <code className="text-slate-400">Authorization: Bearer &lt;token&gt;</code>
                    </p>
                  </div>
                )}

                {/* Basic Auth */}
                {authType === 'basic' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="basicUser" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Username / Service ID
                      </label>
                      <input
                        id="basicUser"
                        type="text"
                        value={credentials.username || ''}
                        onChange={(e) => {
                          setCredentials({ ...credentials, username: e.target.value });
                          setProbeResult({ status: 'idle' });
                        }}
                        placeholder="admin or svc_ghostcode"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="basicPass" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Password / Key Secret
                      </label>
                      <input
                        id="basicPass"
                        type={showSecret ? 'text' : 'password'}
                        value={credentials.password || ''}
                        onChange={(e) => {
                          setCredentials({ ...credentials, password: e.target.value });
                          setProbeResult({ status: 'idle' });
                        }}
                        placeholder="••••••••••••••••"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* mTLS Certificate */}
                {authType === 'mtls' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="clientCert" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Client Certificate (X.509 PEM)
                      </label>
                      <textarea
                        id="clientCert"
                        rows={3}
                        value={credentials.clientCert || ''}
                        onChange={(e) => {
                          setCredentials({ ...credentials, clientCert: e.target.value });
                          setProbeResult({ status: 'idle' });
                        }}
                        placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDXTCCAkWgAwIBAgIUQ...&#10;-----END CERTIFICATE-----"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="clientKey" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Client Private Key (Encrypted RSA / ECDSA PEM)
                      </label>
                      <textarea
                        id="clientKey"
                        rows={3}
                        value={credentials.clientKey || ''}
                        onChange={(e) => {
                          setCredentials({ ...credentials, clientKey: e.target.value });
                          setProbeResult({ status: 'idle' });
                        }}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIEvgIBADANBgkqhkiG9w0BAQEFAASC...&#10;-----END PRIVATE KEY-----"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* Cloud IAM */}
                {authType === 'iam' && (
                  <div>
                    <label htmlFor="iamRole" className="block text-sm font-medium text-slate-300 mb-1.5">
                      AWS IAM Role ARN or GCP Service Account Email
                    </label>
                    <input
                      id="iamRole"
                      type="text"
                      value={credentials.iamRoleArn || ''}
                      onChange={(e) => {
                        setCredentials({ ...credentials, iamRoleArn: e.target.value });
                        setProbeResult({ status: 'idle' });
                      }}
                      placeholder="arn:aws:iam::123456789012:role/GhostCodeCloneOperator"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Assumes STS WebIdentity or OIDC federated token exchange to acquire ephemeral read-only session.
                    </p>
                  </div>
                )}

                {/* API Key */}
                {authType === 'apiKey' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="headerName" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Header Name
                      </label>
                      <input
                        id="headerName"
                        type="text"
                        value={credentials.headerName || 'X-API-Key'}
                        onChange={(e) => {
                          setCredentials({ ...credentials, headerName: e.target.value });
                          setProbeResult({ status: 'idle' });
                        }}
                        placeholder="X-API-Key or X-Service-Token"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="apiKeyValue" className="block text-sm font-medium text-slate-300 mb-1.5">
                        API Key Value
                      </label>
                      <input
                        id="apiKeyValue"
                        type={showSecret ? 'text' : 'password'}
                        value={credentials.apiKeyValue || ''}
                        onChange={(e) => {
                          setCredentials({ ...credentials, apiKeyValue: e.target.value });
                          setProbeResult({ status: 'idle' });
                        }}
                        placeholder="key_live_94827104817"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* Test Connection Probe Button & Display */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5 text-cyan-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">Live Connection & Auth Probe</p>
                        <p className="text-[11px] text-slate-400">Verifies TLS handshake, scopes, and latency before cloning.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingProbe}
                      className="bg-slate-700 hover:bg-slate-600 text-cyan-300 font-semibold py-1.5 px-4 rounded-md text-xs transition-colors flex items-center justify-center gap-2 border border-slate-600 disabled:opacity-50"
                    >
                      <ArrowPathIcon className={`h-3.5 w-3.5 ${isTestingProbe ? 'animate-spin' : ''}`} />
                      <span>{isTestingProbe ? 'Probing Target...' : 'Test Connection & Scope'}</span>
                    </button>
                  </div>

                  {/* Probe Result Feedback */}
                  {probeResult.status === 'success' && (
                    <div className="mt-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-3 text-xs space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Handshake Verified</span>
                        </span>
                        <span className="font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
                          {probeResult.latencyMs}ms ping
                        </span>
                      </div>
                      <p className="text-slate-300">
                        <span className="text-slate-400">Detected Stack:</span> {probeResult.serviceDetected}
                      </p>
                      <p className="text-slate-300">
                        <span className="text-slate-400">Security Suite:</span> {probeResult.tlsVersion}
                      </p>
                      <p className="text-slate-300">
                        <span className="text-slate-400">Granted Scopes:</span> {probeResult.authScope}
                      </p>
                    </div>
                  )}

                  {probeResult.status === 'failed' && (
                    <div className="mt-3 bg-rose-950/40 border border-rose-500/40 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <p className="font-semibold">Connection Check Failed</p>
                        <p className="text-rose-200/80 mt-0.5">{probeResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="pt-4 border-t border-slate-700/60 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  &larr; Back to URL
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <span>Configure Clone Specs</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Clone Configuration & Privacy Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                {/* Capture Depth */}
                <div className="bg-slate-900/50 border border-slate-700/80 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    Capture Depth & Memory Footprint
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    Choose how deeply the live thread state, open sockets, and heap are mirrored.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCaptureDepth('full')}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        captureDepth === 'full'
                          ? 'bg-cyan-950/50 border-cyan-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-xs text-cyan-300">Full Memory State</div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Heap snapshot, call-stacks, live TCP connections (Recommended).
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptureDepth('shallow')}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        captureDepth === 'shallow'
                          ? 'bg-cyan-950/50 border-cyan-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-xs text-cyan-300">Shallow Snapshot</div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Config, environment, and latest logs (Faster sync).
                      </p>
                    </button>
                  </div>
                </div>

                {/* Local Port & Network */}
                <div className="bg-slate-900/50 border border-slate-700/80 rounded-xl p-4">
                  <label htmlFor="localPort" className="block text-sm font-semibold text-white mb-1.5">
                    Local Ghost Bind Port
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    Port on your local machine where the cloned service endpoint will listen.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-xs">
                        localhost:
                      </span>
                      <input
                        id="localPort"
                        type="number"
                        min="1024"
                        max="65535"
                        value={localPort}
                        onChange={(e) => setLocalPort(Number(e.target.value) || 3001)}
                        className="w-full pl-20 pr-3 bg-slate-800 border border-slate-700 rounded-lg py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                      Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggles & Sanitization */}
              <div className="space-y-3 bg-slate-900/50 border border-slate-700/80 rounded-xl p-4">
                {/* PII Sanitizer */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Sanitize PII, Credit Cards, & Secret Tokens
                      </p>
                      <p className="text-xs text-slate-400">
                        Automatically redacts sensitive end-user customer data before storing the snapshot locally.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sanitizePii}
                      onChange={(e) => setSanitizePii(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="border-t border-slate-800 my-1"></div>

                {/* Include Environment Variables */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <LayersIcon className="h-5 w-5 text-cyan-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Include Environment & Config Map</p>
                      <p className="text-xs text-slate-400">
                        Exports runtime environment variables needed for service execution.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEnvVars}
                      onChange={(e) => setIncludeEnvVars(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                <div className="border-t border-slate-800 my-1"></div>

                {/* Mock External APIs */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <ServerIcon className="h-5 w-5 text-cyan-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Egress Isolation & Mock Downstream APIs</p>
                      <p className="text-xs text-slate-400">
                        Prevents local tests from accidentally firing real mutations to third-party APIs (e.g. Stripe, Twilio).
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mockExternalApis}
                      onChange={(e) => setMockExternalApis(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              </div>

              {/* Ready Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-800/80 to-cyan-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Ready for 1-Click Clone</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500 text-white">
                      Zero Downtime
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Target: <code className="text-cyan-300 font-mono">{serviceUrl}</code> &rarr; Local Port{' '}
                    <code className="text-cyan-300 font-mono">:{localPort}</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteClone}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-cyan-600 hover:from-cyan-500 hover:to-cyan-500 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Execute 1-Click Clone</span>
                </button>
              </div>

              {/* Action bar */}
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  &larr; Back to Credentials
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Live Execution & Post-Clone Dashboard */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {cloneMutation.isPending && (
                <div className="text-center py-8 space-y-6">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin"></div>
                    <SparklesIcon className="absolute w-8 h-8 text-cyan-400 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Synthesizing 1-Click Clone...
                    </h3>
                    <p className="text-sm text-cyan-300 font-mono mt-1 animate-pulse">
                      {cloneProgressText}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="max-w-md mx-auto">
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300 rounded-full"
                        style={{ width: `${clonePercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1.5 font-mono">
                      <span>Probing Live System</span>
                      <span>{clonePercent}%</span>
                      <span>Local Mount</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto text-left text-xs bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Target URL</span>
                      <span className="font-mono text-slate-300 truncate block">{serviceUrl}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Auth Token</span>
                      <span className="text-emerald-400 block">&#10003; Handshake OK</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Target Port</span>
                      <span className="font-mono text-cyan-300 block">:{localPort}</span>
                    </div>
                  </div>
                </div>
              )}

              {cloneMutation.isSuccess && (
                <div className="py-4 space-y-6 animate-fade-in">
                  <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      1-Click Clone Live on Your Machine!
                    </h3>
                    <p className="text-sm text-slate-300 max-w-lg mx-auto mt-2">
                      Your production clone <strong className="text-white">{cloneName}</strong> is actively running in an isolated local container on port <code className="text-cyan-400 font-mono font-semibold">http://localhost:{localPort}</code>.
                    </p>

                    {/* Local CLI Command */}
                    <div className="mt-5 max-w-xl mx-auto bg-slate-900 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3 text-left">
                      <div className="font-mono text-xs text-cyan-300 overflow-x-auto whitespace-nowrap">
                        <code>ghostcode attach --port {localPort} --id {createdGhostId}</code>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyDebugCmd}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                        title="Copy command"
                      >
                        {copiedDebugCmd ? (
                          <span className="text-emerald-400 text-xs font-semibold">Copied!</span>
                        ) : (
                          <ClipboardDocumentCheckIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {createdGhostId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onClose) onClose();
                          navigate(`/replay/${createdGhostId}`);
                        }}
                        className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        <PlayIcon className="h-4 w-4" />
                        <span>Launch Time-Travel Replay</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        setClonePercent(0);
                        cloneMutation.reset();
                        setCreatedGhostId(null);
                      }}
                      className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
                    >
                      Clone Another Service
                    </button>

                    {!isEmbedded && onClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-2.5 px-4 rounded-lg text-sm transition-colors"
                      >
                        Close & View in Dashboard
                      </button>
                    )}
                  </div>
                </div>
              )}

              {cloneMutation.isError && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">1-Click Clone Interrupted</h3>
                  <p className="text-sm text-rose-300 max-w-md mx-auto">
                    {cloneMutation.error?.message || 'An error occurred while negotiating the snapshot.'}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        cloneMutation.reset();
                      }}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-lg text-sm"
                    >
                      Check Credentials & Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OneClickCloneWizard;
