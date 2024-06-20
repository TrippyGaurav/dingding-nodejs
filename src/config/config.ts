import { config as conf } from "dotenv";
conf();

const _config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.MONGOURL,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  companyApiKey: process.env.COMPANY_API_KEY,
};

export const config = Object.freeze(_config);
