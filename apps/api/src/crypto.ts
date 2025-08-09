// types are not shipped; declare minimal type
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sodium from "libsodium-wrappers";

export async function encryptWithKey(base64Key: string, plaintext: string): Promise<string> {
  await sodium.ready;
  const key = Buffer.from(base64Key.replace(/^base64:/, ""), "base64");
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const cipher = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  return `v1:${Buffer.from(nonce).toString("base64")}:${Buffer.from(cipher).toString("base64")}`;
}

export async function decryptWithKey(base64Key: string, blob: string): Promise<string> {
  await sodium.ready;
  const key = Buffer.from(base64Key.replace(/^base64:/, ""), "base64");
  const [v, n, c] = blob.split(":");
  if (v !== "v1") throw new Error("Unsupported cipher version");
  const nonce = Buffer.from(n ?? "", "base64");
  const cipher = Buffer.from(c ?? "", "base64");
  const plain = sodium.crypto_secretbox_open_easy(cipher, nonce, key);
  return Buffer.from(plain).toString("utf8");
}

