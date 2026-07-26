import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEMO_MODE: z.string().default('true').transform((value) => value === 'true'),
  NEXT_PUBLIC_APP_NAME: z.string().default('BayadinBills'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3002'),
  DRIZZLE_DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/stellar_agent_b'),
  STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('testnet'),
  STELLAR_HORIZON_URL: z.string().url().optional(),
  STELLAR_NETWORK_PASSPHRASE: z.string().optional(),
  STELLAR_PLATFORM_ADDRESS: z.string().length(56).default('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'),
  USDC_ASSET_CODE: z.string().min(1).max(12).default('USDC'),
  USDC_ASSET_ISSUER_TESTNET: z.string().length(56).default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  USDC_ASSET_ISSUER_PUBLIC: z.string().length(56).default('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars').default('bayadin-bills-demo-session-secret-2026-stellar'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

const networkDefaults = {
  testnet: { horizonUrl: 'https://horizon-testnet.stellar.org', passphrase: 'Test SDF Network ; September 2015' },
  public: { horizonUrl: 'https://horizon.stellar.org', passphrase: 'Public Global Stellar Network ; September 2015' },
  futurenet: { horizonUrl: 'https://horizon-futurenet.stellar.org', passphrase: 'Test SDF Future Network ; October 2022' },
} as const;
const defaults = networkDefaults[parsed.data.STELLAR_NETWORK];

export const env = {
  ...parsed.data,
  STELLAR_HORIZON_URL: parsed.data.STELLAR_HORIZON_URL ?? defaults.horizonUrl,
  STELLAR_NETWORK_PASSPHRASE: parsed.data.STELLAR_NETWORK_PASSPHRASE ?? defaults.passphrase,
};
export const USDC_ASSET_ISSUER =
  env.STELLAR_NETWORK === 'public' ? env.USDC_ASSET_ISSUER_PUBLIC : env.USDC_ASSET_ISSUER_TESTNET;
export type Env = typeof env;
