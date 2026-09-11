import { enable } from '../lib/enable.mjs';
enable({ vault: process.env.VAULT, scrub: true });
console.log('[test] sidecar enabled');
