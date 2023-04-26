import { Prisma } from '@prisma/client';
import { PrismaErrorCodes } from '../types';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EXCEPTION_MESSAGES } from '../constants';
import { NotFoundError } from './errors';

function isPrismaClientKnownRequestError(error: any) {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function isNotUniqueError(error: any) {
  return error.code === PrismaErrorCodes.NOT_UNIQUE && error.meta;
}

function isNotFoundError(error: any) {
  return (
    error?.code === PrismaErrorCodes.NOT_FOUND || error instanceof NotFoundError
  );
}

function handleNotUniqueError(error: any) {
  if (isNotUniqueError(error)) {
    throw new BadRequestException(`${error.meta.target} is not unique`);
  }
}

function handleUpdateError(error: any, entityName: string, id: number) {
  if (isPrismaClientKnownRequestError(error)) {
    handleNotUniqueError(error);

    if (isNotFoundError(error)) {
      throw new NotFoundException(
        EXCEPTION_MESSAGES.ENTITY_NOT_FOUND(entityName, id),
      );
    }
  }

  throw new BadRequestException();
}

function handleCreateError(error: any) {
  if (isPrismaClientKnownRequestError(error)) {
    handleNotUniqueError(error);
  }

  throw new BadRequestException();
}

function handleGenerateError(error: any, email: string) {
  if (isPrismaClientKnownRequestError(error)) {
    if (isNotFoundError(error)) {
      throw new NotFoundException(
        EXCEPTION_MESSAGES.USER_NOT_FOUND_BY_EMAIL(email),
      );
    }
  }
}

function handleResetPasswordError(error: any, email: string) {
  if (isNotFoundError(error)) {
    throw new NotFoundException(
      EXCEPTION_MESSAGES.USER_NOT_FOUND_BY_EMAIL(email),
    );
  }

  throw new InternalServerErrorException();
}

function handleUpdatePasswordError(error: any) {
  if (isNotFoundError(error)) {
    throw new NotFoundException();
  }

  throw new BadRequestException();
}

export {
  handleCreateError,
  handleUpdateError,
  handleGenerateError,
  handleResetPasswordError,
  handleUpdatePasswordError,
};
