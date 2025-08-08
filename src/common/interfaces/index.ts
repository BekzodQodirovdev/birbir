export interface JwtPayload {
  sub: string;
  role: string;
}

export class TokenResponse {
  accessToken: string;
  refreshToken: string;
}
