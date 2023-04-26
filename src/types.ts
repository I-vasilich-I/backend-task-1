import { getResponseUser } from './helpers';

const enum PrismaErrorCodes {
  NOT_UNIQUE = 'P2002',
  NOT_FOUND = 'P2025',
}

const enum Strategies {
  LOCAL = 'LOCAL',
  JWT_ACCESS = 'JWT_ACCESS',
  JWT_REFRESH = 'JWT_REFRESH',
}

type TokenPayload = {
  id: number;
  email: string;
};

type ResponseUser = ReturnType<typeof getResponseUser>;

export { PrismaErrorCodes, Strategies, TokenPayload, ResponseUser };
