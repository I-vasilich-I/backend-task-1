const EXCEPTION_MESSAGES = {
  ONLY_IMAGE_ALLOWED: 'Only image files are allowed!',
  ENTITY_NOT_FOUND: (entityName: string, id: number) =>
    `${entityName} with id: ${id} doesn't exist`,
  USER_NOT_FOUND_BY_EMAIL: (email: string) =>
    `User with email: ${email} doesn't exist`,
};

const MAX_IMAGE_SIZE_BITES = 5 * 1024 * 1024;

const TEMPLATES = {
  PDF: 'users/templates/pdf.hbs',
};

export { EXCEPTION_MESSAGES, MAX_IMAGE_SIZE_BITES, TEMPLATES };
