import { Test, TestingModule } from '@nestjs/testing';
import { MailerService as MailService } from '@nestjs-modules/mailer';
import { MailerService } from './mailer.service';
import { InternalServerErrorException } from '@nestjs/common';

class MailServiceFake {
  public sendMail(): void {
    return;
  }
}

describe('MailerService', () => {
  let service: MailerService;
  let mailService: MailService;
  let sendMailSpy: any;

  beforeEach(async () => {
    const MailProvider = {
      provide: MailService,
      useClass: MailServiceFake,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService, MailProvider],
    }).compile();

    service = module.get<MailerService>(MailerService);
    mailService = module.get(MailService);
    sendMailSpy = jest.spyOn(mailService, 'sendMail');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call sendMail method', async () => {
    await service.sendResetPasswordMail('User', 'email@test.com', 'url');
    expect(sendMailSpy).toBeCalled();
  });

  it('should throw InternalServerErrorException', async () => {
    try {
      jest.spyOn(mailService, 'sendMail').mockImplementationOnce(() => {
        throw new InternalServerErrorException();
      });
      await service.sendResetPasswordMail('User', 'email@test.com', 'url');
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
    }
  });
});
