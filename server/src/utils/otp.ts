import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const generateNumericOtp = (length: number = 6): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

export const compareOtp = async (otp: string, hashedOtp: string): Promise<boolean> => {
  return bcrypt.compare(otp, hashedOtp);
};

