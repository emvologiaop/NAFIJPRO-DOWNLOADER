import crypto from 'crypto';

/**
 * Generate HMAC-SHA256 signature for signed requests
 *
 * Canonical string format: METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
 */
export function generateWebSignature(
  method: string,
  path: string,
  secret: string,
  body?: string | Buffer
): {
  signature: string;
  timestamp: string;
  nonce: string;
} {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Calculate body hash (SHA-256)
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body || '');
  const bodyHash = crypto.createHash('sha256').update(bodyBuffer).digest('hex');

  // Build canonical string: METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
  const canonical = [
    method.toUpperCase(),
    path,
    timestamp,
    nonce,
    bodyHash,
  ].join('\n');

  // Generate HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', secret)
    .update(canonical)
    .digest('hex');

  return { signature, timestamp, nonce };
}
