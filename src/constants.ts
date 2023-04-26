const EXCEPTION_MESSAGES = {
  REFRESH_TOKEN_MALFORMED: 'Refresh token malformed',
  ONLY_IMAGE_ALLOWED: 'Only image files are allowed!',
  ENTITY_NOT_FOUND: (entityName: string, id: number) =>
    `${entityName} with id: ${id} doesn't exist`,
  USER_NOT_FOUND_BY_EMAIL: (email: string) =>
    `User with email: ${email} doesn't exist`,
};

const MAX_IMAGE_SIZE_BITES = 5 * 1024 * 1024;
const MAX_AGE_TOKEN_COOKIE = 30 * 24 * 60 * 60 * 1000;

const TEMPLATES = {
  PDF: 'users/templates/pdf.hbs',
};

const ENV_VARIABLES = {
  HASH_ROUNDS: 'HASH_ROUNDS',
  JWT_SECRET_KEY: 'JWT_SECRET_KEY',
  JWT_SECRET_REFRESH_KEY: 'JWT_SECRET_REFRESH_KEY',
  TOKEN_EXPIRE_TIME: 'TOKEN_EXPIRE_TIME',
  TOKEN_REFRESH_EXPIRE_TIME: 'TOKEN_REFRESH_EXPIRE_TIME',
  CLIENT_URL: 'CLIENT_URL',
};

const COOKIES = {
  REFRESH_TOKEN: 'refreshToken',
};

export {
  EXCEPTION_MESSAGES,
  MAX_IMAGE_SIZE_BITES,
  TEMPLATES,
  ENV_VARIABLES,
  COOKIES,
  MAX_AGE_TOKEN_COOKIE,
};
