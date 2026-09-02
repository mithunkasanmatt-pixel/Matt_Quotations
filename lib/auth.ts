import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-quotation-portal-key-change-me';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export function verifyPassword(password: string, hash: string): boolean {
  if (hash.startsWith('scrypt:')) {
    try {
      const parts = hash.split('$');
      if (parts.length !== 3) return false;
      
      const params = parts[0].split(':'); // ["scrypt", "32768", "8", "1"]
      const salt = parts[1];
      const hashHex = parts[2];
      
      const N = parseInt(params[1]) || 32768;
      const r = parseInt(params[2]) || 8;
      const p = parseInt(params[3]) || 1;
      
      const derivedKey = crypto.scryptSync(password, salt, 64, { N, r, p, maxmem: 128 * 1024 * 1024 });
      return derivedKey.toString('hex') === hashHex;
    } catch (err) {
      console.error('Scrypt password verification error:', err);
      return false;
    }
  }
  
  // Fallback to bcrypt
  try {
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    console.error('Bcrypt password verification error:', err);
    return false;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function getAuthUser(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}
