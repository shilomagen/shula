import { registerAs } from '@nestjs/config';

export default registerAs('backend', () => ({
  url: process.env.BACKEND_URL,
}));
