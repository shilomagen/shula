import qrcode from 'qrcode-terminal';

export function generateQR(text: string): Promise<string> {
  return new Promise((resolve) => {
    qrcode.generate(text, { small: false }, (qr) => {
      resolve(qr);
    });
  });
}

export { qrcode };
