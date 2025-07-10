import { registerAs } from '@nestjs/config';

export const shulaConfig = registerAs('shula', () => ({
  phoneNumber: process.env.SHULA_PHONE_NUMBER || '+972552654166',
}));
