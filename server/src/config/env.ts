import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RESET_PASSWORD_SECRET: z.string().min(16, 'RESET_PASSWORD_SECRET must be at least 16 characters'),
  RESET_TOKEN_EXPIRES_IN: z.string().default('10m'),
  OTP_EXPIRES_IN_MINUTES: z.coerce.number().default(10),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  MAX_OTP_ATTEMPTS: z.coerce.number().default(5),
  CORS_ORIGIN: z.string().default('*'),

  // SMTP Email Configurations
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('devops@kaizeninfinities.com'),
  FROM_NAME: z.string().default('Kaizen'),

  // Cloudinary Configurations
  CLOUDINARY_CLOUD_NAME: z.string().default('uoyjkcmp'),
  CLOUDINARY_API_KEY: z.string().default('683385166799711'),
  CLOUDINARY_API_SECRET: z.string().default('rBYiSVv8BhHyz4zwyaJDSmruBrA'),

  // AI Integration Configurations (Backend Only)
  AI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gemini-1.5-flash'),
  AI_PROVIDER: z.string().default('gemini'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const ENV = parsedEnv.data;

