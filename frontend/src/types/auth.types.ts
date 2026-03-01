export interface User {
  id: string;
  email: string;
  display_name: string;
  picture_url: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
