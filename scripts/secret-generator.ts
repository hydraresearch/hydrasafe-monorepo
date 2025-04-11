import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

class SecretManager {
  private static ENVIRONMENT_TYPES = ['development', 'staging', 'production'];
  private static ENV_PATH = path.resolve(__dirname, '../.env');
  private static ENV_EXAMPLE_PATH = path.resolve(__dirname, '../.env.example');

  /**
   * Generate a cryptographically secure random secret
   * @param length Length of the secret (default 64 bytes)
   * @returns Base64 encoded secret
   */
  public static generateSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Generate environment-specific secrets
   */
  public static generateEnvironmentSecrets(): Record<string, string> {
    return {
      JWT_SECRET: this.generateSecret(),
      MONGODB_PASSWORD: this.generateSecret(32),
      ETH_PROVIDER_KEY: this.generateSecret(48),
      BTC_PROVIDER_KEY: this.generateSecret(48),
      ENCRYPTION_KEY: this.generateSecret(32)
    };
  }

  /**
   * Update .env file with new secrets
   * @param environment Target environment
   */
  public static updateEnvFile(environment: string = 'development'): void {
    if (!this.ENVIRONMENT_TYPES.includes(environment)) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    const newSecrets = this.generateEnvironmentSecrets();
    
    // Read existing .env file
    let existingEnv: string;
    try {
      existingEnv = fs.readFileSync(this.ENV_PATH, 'utf8');
    } catch (error) {
      existingEnv = '';
    }

    // Update or append secrets
    const updatedEnv = this.updateEnvContent(existingEnv, newSecrets);

    // Write updated secrets
    fs.writeFileSync(this.ENV_PATH, updatedEnv, 'utf8');
    console.log(`🔐 Secrets updated for ${environment} environment`);
  }

  /**
   * Update environment file content with new secrets
   */
  private static updateEnvContent(
    existingEnv: string, 
    newSecrets: Record<string, string>
  ): string {
    let updatedEnv = existingEnv;

    for (const [key, value] of Object.entries(newSecrets)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(updatedEnv)) {
        // Replace existing secret
        updatedEnv = updatedEnv.replace(regex, `${key}=${value}`);
      } else {
        // Append new secret
        updatedEnv += `\n${key}=${value}`;
      }
    }

    return updatedEnv.trim() + '\n';
  }

  /**
   * Validate and sanitize secrets
   */
  public static validateSecrets(secrets: Record<string, string>): boolean {
    return Object.values(secrets).every(secret => 
      secret.length >= 32 && /^[A-Za-z0-9+/=]+$/.test(secret)
    );
  }
}

// CLI Interface
const args = process.argv.slice(2);
const environment = args[0] || 'development';

try {
  SecretManager.updateEnvFile(environment);
} catch (error) {
  console.error('🚨 Secret generation failed:', error);
  process.exit(1);
}

export default SecretManager;
