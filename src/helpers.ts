import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { User } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { compile } from 'handlebars';
import puppeteer from 'puppeteer';
import { EXCEPTION_MESSAGES } from './constants';

const exclude = <T, Key extends keyof T>(
  entity: T,
  keys: Key[],
): Omit<T, Key> => {
  for (const key of keys) {
    delete entity[key];
  }

  return entity;
};

const imageFileFilter: MulterOptions['fileFilter'] = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
    return callback(
      new BadRequestException(EXCEPTION_MESSAGES.ONLY_IMAGE_ALLOWED),
      false,
    );
  }

  return callback(null, true);
};

const convertImageToString = (image: Express.Multer.File) =>
  `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;

const generatePdfData = async (
  data: { fullName: string; image: string },
  templatePath: string,
) => {
  const source = await readFile(join(__dirname, templatePath));
  const template = compile(source.toString());
  const html = template({ ...data });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--headless',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  // To reflect CSS used for screens instead of print
  await page.emulateMediaType('screen');
  const pdfBuffer = await page.pdf({
    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
    printBackground: true,
    format: 'A4',
  });

  return pdfBuffer;
};

const getResponseUser = (user: User) =>
  exclude(user, ['password', 'refreshToken', 'resetCode']);

export {
  exclude,
  imageFileFilter,
  convertImageToString,
  generatePdfData,
  getResponseUser,
};
