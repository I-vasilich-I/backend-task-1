import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from './mailer/mailer.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAccessStrategy } from './auth/strategies/jwt-access.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAccessAuthGuard } from './auth/guards/jwt-access-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailerModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    JwtAccessStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAccessAuthGuard,
    },
  ],
})
export class AppModule {}
