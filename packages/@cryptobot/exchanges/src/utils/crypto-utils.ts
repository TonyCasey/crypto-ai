import * as crypto from 'crypto';

export class CryptoUtils {
  static createHmacSha256(secret: string, message: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }

  static createHmacSha256Base64(secret: string, message: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('base64');
  }

  static createSha256Hash(message: string): string {
    return crypto
      .createHash('sha256')
      .update(message)
      .digest('hex');
  }

  static base64Encode(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  static base64Decode(data: string): string {
    return Buffer.from(data, 'base64').toString();
  }

  static generateNonce(): string {
    return Date.now().toString();
  }

  static generateRandomString(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  static validateApiKey(apiKey: string): boolean {
    return !!apiKey && apiKey.length > 0;
  }

  static validateApiSecret(apiSecret: string): boolean {
    return !!apiSecret && apiSecret.length > 0;
  }

  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '***';
    return apiKey.slice(0, 4) + '***' + apiKey.slice(-4);
  }

  static maskApiSecret(apiSecret: string): string {
    return '***';
  }
}