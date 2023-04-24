import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { MailerService as MailService } from '@nestjs-modules/mailer';

const FAILED_TO_SEND_MAIL_MSG = 'Failed to send a password reset mail';

@Injectable()
export class MailerService {
  constructor(private mailService: MailService) {}

  async sendResetPasswordMail(
    userName: string,
    email: string,
    resetPassLink: string,
  ): Promise<void> {
    try {
      await this.mailService.sendMail({
        to: email,
        subject: 'Reset password',
        template: './reset-pass-email',
        context: {
          userName,
          resetPassLink,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(FAILED_TO_SEND_MAIL_MSG);
    }
  }
}
