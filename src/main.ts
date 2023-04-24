import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  await prismaService.enableShutdownHooks(app);
  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();
