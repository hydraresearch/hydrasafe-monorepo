import * as blake3 from "blake3"

export default blake3

export const ResetHasher = (hasher: blake3.NodeHash | undefined) => {
  if (hasher) {
    hasher.dispose(); // clearing hasher for security
  }
}

export const DeriveKeyAndHash = (context: Buffer, data: Buffer | string): Buffer => {

  const newKey:Buffer = blake3.deriveKey(context, data, { length: 32 });   
  const hash = blake3.createKeyed(newKey);
  hash.update(data);
  return hash.digest();
}

export const verifyKeyedHash = (context: Buffer, data: Buffer | string, key: Buffer, hash: Buffer): boolean => {
  const newKey:Buffer = blake3.deriveKey(context, data, { length: 32 });   
  const hash2 = blake3.createKeyed(newKey);
  hash2.update(data);
  return hash2.digest().equals(hash);
}

export const HashToBlake3Sync = (data: Buffer | string): Buffer => {
  const hash = blake3.createHash();
  hash.update(data);
  return hash.digest();
}

export const HashToBlake3WithKey = (data: Buffer | string, key: Buffer): Buffer => {
  const hash = blake3.createKeyed(key);
  hash.update(data);
  return hash.digest();
}

export const verifyHash = (data: Buffer | string, hash: Buffer): boolean => {
  const hash2 = blake3.createHash();
  hash2.update(data);
  return hash2.digest().equals(hash);
}

