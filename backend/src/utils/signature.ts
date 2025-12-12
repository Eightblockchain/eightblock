import { ed25519 } from '@noble/curves/ed25519.js';
import cbor from 'cbor';
import { bech32, bech32m } from 'bech32';

/**
 * Verify a Cardano wallet signature using CIP-8 and CIP-30 standards
 *
 * This implements proper Ed25519 signature verification for Cardano wallet authentication.
 * The wallet signs the nonce using their private key, and we verify it using the public key.
 *
 * CIP-30 wallets return CBOR-encoded signatures in COSE_Sign1 format.
 *
 * @param walletAddress - The wallet address that signed the message
 * @param nonce - The original nonce message that was signed (hex string)
 * @param signature - The CBOR-encoded COSE_Sign1 signature (hex string from CIP-30 signData)
 * @param key - The CBOR-encoded COSE_Key public key (hex string from CIP-30 signData)
 * @returns Object with valid boolean and publicKey Uint8Array
 */
export async function verifyCardanoSignature(
  walletAddress: string,
  nonce: string,
  signature: string,
  key: string
): Promise<{ valid: boolean; publicKey: Uint8Array | null }> {
  try {
    // Validate inputs
    if (!signature || typeof signature !== 'string') {
      console.warn('[Security] Invalid signature format');
      return { valid: false, publicKey: null };
    }

    if (!key || typeof key !== 'string') {
      console.warn('[Security] Invalid public key format');
      return { valid: false, publicKey: null };
    }

    if (!walletAddress.startsWith('addr1')) {
      console.warn('[Security] Invalid wallet address format');
      return { valid: false, publicKey: null };
    }

    // Validate hex format
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(signature) || !hexRegex.test(key) || !hexRegex.test(nonce)) {
      console.warn('[Security] Signature, key, or nonce is not valid hex');
      return { valid: false, publicKey: null };
    }

    // Decode CBOR structures
    const signatureBytes = hexToBytes(signature);
    const keyBytes = hexToBytes(key);

    // Decode the CBOR structures
    // COSE_Sign1 is an array: [protected_headers, unprotected_headers, payload, signature]
    // COSE_Key is a map with integer keys
    const decodedSig = cbor.decode(Buffer.from(signatureBytes));
    const decodedKey = cbor.decode(Buffer.from(keyBytes));

    const protectedHeaders = decodedSig[0];
    let signingAddressHex: string | null = null;
    if (Buffer.isBuffer(protectedHeaders) && protectedHeaders.length > 0) {
      try {
        const decodedProtected = cbor.decode(protectedHeaders);
        const protectedAddress = decodedProtected?.address;
        if (Buffer.isBuffer(protectedAddress)) {
          signingAddressHex = protectedAddress.toString('hex');
        }
      } catch (_error) {
        // If protected headers can't be decoded we still attempt verification
      }
    }

    // Extract the signature payload (index 2) and signature bytes (index 3)
    if (!Array.isArray(decodedSig) || decodedSig.length < 4) {
      console.warn('[Security] Invalid COSE_Sign1 structure');
      return { valid: false, publicKey: null };
    }

    const payload = decodedSig[2];
    const sig = decodedSig[3];

    if (!Buffer.isBuffer(payload) || !Buffer.isBuffer(sig)) {
      console.warn('[Security] Invalid payload or signature in COSE_Sign1');
      return { valid: false, publicKey: null };
    }

    const payloadHex = payload.toString('hex');

    const walletAddressHex = bech32AddressToHex(walletAddress);
    if (!walletAddressHex) {
      console.warn('[Security] Failed to decode wallet bech32 address');
      return { valid: false, publicKey: null };
    }

    if (signingAddressHex && signingAddressHex !== walletAddressHex) {
      console.warn('[Security] Address mismatch between request and signed payload');
      return { valid: false, publicKey: null };
    }

    // Verify the payload matches the nonce
    if (payloadHex !== nonce.toLowerCase()) {
      console.warn('[Security] Payload does not match nonce');
      return { valid: false, publicKey: null };
    }

    // Extract the public key from COSE_Key (key -2)
    if (!(decodedKey instanceof Map)) {
      console.warn('[Security] Invalid COSE_Key structure');
      return { valid: false, publicKey: null };
    }

    const publicKeyBuffer = decodedKey.get(-2);
    if (!Buffer.isBuffer(publicKeyBuffer)) {
      console.warn('[Security] No public key in COSE_Key');
      return { valid: false, publicKey: null };
    }

    const publicKey = new Uint8Array(publicKeyBuffer);
    const signatureArray = new Uint8Array(sig);

    // CIP-8 (COSE_Sign1) requires verifying the signature against the Sig_structure:
    // Sig_structure = ["Signature1", protected, external_aad, payload]
    const protectedBytes = Buffer.isBuffer(decodedSig[0]) ? decodedSig[0] : Buffer.alloc(0);
    const externalAAD = Buffer.alloc(0);
    const sigStructure = ['Signature1', protectedBytes, externalAAD, payload];
    const messageArray = new Uint8Array(cbor.encode(sigStructure));

    // Verify the Ed25519 signature
    const isValid = ed25519.verify(signatureArray, messageArray, publicKey);

    if (!isValid) {
      console.warn(
        '[Security] ✗ Invalid signature for wallet:',
        walletAddress.substring(0, 15) + '...'
      );
    }

    return { valid: isValid, publicKey: isValid ? publicKey : null };
  } catch (error) {
    console.error('[Security] Signature verification error:', error);
    if (error instanceof Error) {
      console.error('[Security] Error message:', error.message);
    }
    return { valid: false, publicKey: null };
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bech32AddressToHex(address: string): string | null {
  const decoders = [bech32, bech32m];
  for (const decoder of decoders) {
    try {
      const { words } = decoder.decode(address, 1023);
      const bytes = Buffer.from(decoder.fromWords(words));
      return bytes.toString('hex');
    } catch (_error) {
      continue;
    }
  }
  return null;
}

/**
 * Derive Cardano payment address from Ed25519 public key
 * This validates that the COSE public key actually belongs to the claimed wallet address
 *
 * @param publicKey - The Ed25519 public key from COSE_Key
 * @returns The derived bech32 address or null if derivation fails
 */
export async function deriveAddressFromPublicKey(
  publicKey: Uint8Array | null
): Promise<string | null> {
  if (!publicKey || publicKey.length !== 32) {
    console.warn('[Security] Invalid public key length:', publicKey?.length);
    return null;
  }

  try {
    // Import blake2b for hashing (Cardano uses Blake2b-224 for payment key hash)
    const { blake2b } = await import('@noble/hashes/blake2.js');

    // Hash the public key with Blake2b-224 (28 bytes)
    const keyHash = blake2b(publicKey, { dkLen: 28 });

    console.log(
      '[Debug] Public key (first 16 bytes):',
      Buffer.from(publicKey.slice(0, 16)).toString('hex')
    );
    console.log(
      '[Debug] Key hash (first 16 bytes):',
      Buffer.from(keyHash.slice(0, 16)).toString('hex')
    );

    // Cardano address structure for mainnet payment address (type 0b0000)
    // [1 byte header (network + type) | 28 bytes payment key hash]
    const addressBytes = new Uint8Array(29);
    addressBytes[0] = 0b00000001; // Mainnet, payment key hash only
    addressBytes.set(keyHash, 1);

    // Encode to bech32 with 'addr' prefix - use methods from bech32 object
    const words = bech32.toWords(Array.from(addressBytes));
    const address = bech32.encode('addr', words, 1023);

    console.log('[Debug] Derived address:', address);

    return address;
  } catch (error) {
    console.error('[Security] Failed to derive address from public key:', error);
    return null;
  }
}

/**
 * Extract payment key hash from a Cardano address
 * Works with both base addresses and payment-only addresses
 *
 * @param address - Bech32 encoded Cardano address
 * @returns The 28-byte payment key hash or null
 */
export function extractPaymentKeyHash(address: string): Uint8Array | null {
  try {
    const decoded = bech32.decode(address, 1023);
    const addressBytes = new Uint8Array(bech32.fromWords(decoded.words));

    // First byte is header (network + address type)
    // Payment key hash is always bytes 1-28 for both:
    // - Base addresses (0b0000xxxx): [header][payment hash 28 bytes][stake hash 28 bytes]
    // - Enterprise addresses (0b0110xxxx): [header][payment hash 28 bytes]
    // - Payment addresses (0b0110xxxx): [header][payment hash 28 bytes]

    if (addressBytes.length < 29) {
      console.warn('[Security] Address too short to contain payment key hash');
      return null;
    }

    const paymentKeyHash = addressBytes.slice(1, 29);
    return paymentKeyHash;
  } catch (error) {
    console.error('[Security] Failed to extract payment key hash:', error);
    return null;
  }
}

/**
 * Verify that a public key matches a wallet address by comparing payment key hashes
 * This works with any Cardano address type (base, enterprise, payment-only)
 */
export async function verifyPublicKeyMatchesAddress(
  publicKey: Uint8Array | null,
  walletAddress: string
): Promise<boolean> {
  if (!publicKey || publicKey.length !== 32) {
    return false;
  }

  try {
    // Import blake2b for hashing
    const { blake2b } = await import('@noble/hashes/blake2.js');

    // Hash the public key to get payment key hash
    const derivedKeyHash = blake2b(publicKey, { dkLen: 28 });

    // Extract payment key hash from the claimed address
    const claimedKeyHash = extractPaymentKeyHash(walletAddress);

    if (!claimedKeyHash) {
      console.warn('[Security] Could not extract payment key hash from address');
      return false;
    }

    // Compare the two hashes
    const match = Buffer.from(derivedKeyHash).equals(Buffer.from(claimedKeyHash));

    if (!match) {
      console.warn('[Security] Payment key hash mismatch');
      console.log('[Debug] Derived hash:', Buffer.from(derivedKeyHash).toString('hex'));
      console.log('[Debug] Claimed hash:', Buffer.from(claimedKeyHash).toString('hex'));
    }

    return match;
  } catch (error) {
    console.error('[Security] Failed to verify public key against address:', error);
    return false;
  }
}
