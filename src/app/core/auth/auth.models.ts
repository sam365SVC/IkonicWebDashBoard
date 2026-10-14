export enum UserRole {
  Dev = 1,
  Usuario = 2
}

export interface MicrosoftAuthRequest {
  idToken: string;
  numeroCelular?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  sesionId: string;
  email: string;
  rol: number | string;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  rol?: string | number;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodifica de forma segura la sección payload de un token JWT (base64url)
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
