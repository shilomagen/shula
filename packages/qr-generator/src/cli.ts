#!/usr/bin/env node

import { Command } from 'commander';
import qrcode from 'qrcode-terminal';

const program = new Command();

program
  .name('qr-generator')
  .description('CLI to generate and display QR codes in the terminal')
  .version('0.0.1')
  .option('-q, --qr <text>', 'Text or URL to encode as QR code')
  .action((options) => {
    if (!options.qr) {
      console.error('Please provide a text or URL to encode using --qr option');
      process.exit(1);
    }

    qrcode.generate(options.qr, { small: true }, (qrcode) => {
      console.log('\nQR Code for:', options.qr);
      console.log(qrcode);
    });
  });

program.parse();
