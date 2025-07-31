// @ts-nocheck
/* eslint-disable */

// 🎭 FACADE – Semplificare un sistema complesso dietro un’interfaccia unica

//Es1.  Inviare una mail coinvolge logger, template, provider API, retry... tu vuoi:
await emailService.sendWelcomeEmail(user.email);

// Ma internamente lui gestisce n cose (template, providerEmail, logger, retry, etc):
class EmailService {
   constructor(private smtpClient, private logger, private templates) { }

   async sendWelcomeEmail(to: string) {
      const html = this.templates.render('welcome', { name: 'Ema' });
      await this.smtpClient.send(to, html);
      this.logger.info('Email sent');
   }
}

//Es2. UserService → aggrega DB + cache + events
class UserService {
   async createUser(dto: CreateUserDto) {
      const user = await this.db.save(dto);
      await this.cache.set(`user:${user.id}`, user);
      this.events.emit('user_created', user);
      return user;
   }
}
