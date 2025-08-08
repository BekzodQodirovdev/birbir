import * as dotenv from 'dotenv';
dotenv.config();

export type ConfigType = {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASS: string;
  DB_NAME: string;
  ACCESS_TOKEN_KEY: string;
  ACCESS_TOKEN_TIME: string;
  REFRESH_TOKEN_KEY: string;
  REFRESH_TOKEN_TIME: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  APPLE_CLIENT_ID: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
  APPLE_PRIVATE_KEY_PATH: string;
  APPLE_CALLBACK_URL: string;
  FACEBOOK_CLIENT_ID: string;
  FACEBOOK_CLIENT_SECRET: string;
  FACEBOOK_CALLBACK_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_NAME: string;
  FRONTEND_SOCIAL_LOGIN_URL: string;
};

export const config: ConfigType = {
  PORT: Number(process.env.PORT),
  DB_HOST: process.env.DB_HOST as string,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER as string,
  DB_PASS: process.env.DB_PASS as string,
  DB_NAME: process.env.DB_NAME as string,
  ACCESS_TOKEN_KEY: process.env.ACCESS_TOKEN_KEY as string,
  ACCESS_TOKEN_TIME: process.env.ACCESS_TOKEN_TIME as string,
  REFRESH_TOKEN_KEY: process.env.REFRESH_TOKEN_KEY as string,
  REFRESH_TOKEN_TIME: process.env.REFRESH_TOKEN_TIME as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID as string,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID as string,
  APPLE_KEY_ID: process.env.APPLE_KEY_ID as string,
  APPLE_PRIVATE_KEY_PATH: process.env.APPLE_PRIVATE_KEY_PATH as string,
  APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL as string,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID as string,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET as string,
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL as string,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN as string,
  TELEGRAM_BOT_NAME: process.env.TELEGRAM_BOT_NAME as string,
  FRONTEND_SOCIAL_LOGIN_URL: process.env.FRONTEND_SOCIAL_LOGIN_URL as string,
};
