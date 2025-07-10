import { registerAs } from '@nestjs/config';

export const whatsappConfig = registerAs('whatsapp', () => ({
  containerUrl: process.env.WHATSAPP_CONTAINER_URL || 'http://localhost:3001',
}));
