import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { SharedModule } from './shared/shared.module';
import { DocumentsModule } from './documents/documents.module';
import { JurisdictionsModule } from './jurisdictions/jurisdictions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { Statute } from './documents/entities/statute.entity';
import { EmbeddingService } from './documents/services/embedding.service';
import { Regulation } from './documents/entities/regulation.entity';
import { Status } from './documents/entities/status.entity';
import { Crons } from './cron.entity';
import { Case } from './documents/entities/case.entity';
import { ChatModule } from './chat/chat.module';
import { Message } from './chat/entities/message.entity';
import { Configuration } from './documents/entities/configuration.entity';


@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
    }),
     ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
          ca: `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUFMY7g/gl96OaxPd/8S2wnI/bavYwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1NzYyNzYwOWYtOGI5NC00YTNkLTg1OTItZTliZWZhYTJj
ZmNlIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwNjE3MTIyMTQxWhcNMzUwNjE1MTIy
MTQxWjBAMT4wPAYDVQQDDDU3NjI3NjA5Zi04Yjk0LTRhM2QtODU5Mi1lOWJlZmFh
MmNmY2UgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAN6G/DqFjk79qSzLlo3rAQHZMKWYTQYBUf3sGnZGkdtD/SaETn2QNHvR
eEXUG7BKIqoz8ruczkij90YAiH/cSOdL0bS9rfZB2/lMy1oUMGjgrtdAS8X7nTPP
7zthy6EOzMfmb+WXtXzfXXUUvhlVKRO1MNecYp6PWGZTKRwwQeGvWPMVBruyvkgs
V/Se70WU6XZ3YJtj/+7f8548KliDnxPNBDo27A7AflXVpj4X7uTXV4fXu5WL1s5m
eQOBoYRoY1kbcf/OQyoaZCe13HbulIkpqrzpQ4EKNG7zOf3TlDovlYlKpAHA9uvm
y4vlYLjaTMH6B34WFdVBpRcJPahgyD3axvqHShdyXgQEKt1r70Sgvm0D1CV2nQqA
W0YUajfr+QrK89eqXnXyU43XL1ulhrtNjl4bcSOAJDVR3CjwHVI95ZJcGL5+m/5K
9AmNVIRfpO/p569fG46HwP2cy4xmBfcZOjw7XMbmdXtVnd2y9kjos7/yZkJ1lgTT
UBuUxwxJPwIDAQABo0IwQDAdBgNVHQ4EFgQUKIGjJLXwW23PrJ2chOGPWRg+4z8w
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBABRAzDjsF2+hzYgUfZncheqBIlXuP3eOcPav838fsgCMUeQNq/2QovWHpIP5
k8g2BwIXhdhZqOn4WIYWIQ8T1UwmE3gLic64rfUPkeOOJx10BHpkqCawW1AuFfQV
9LQH/GCQd78xtbvvgoDX0DTGFBJ8j/UeWhuNZtC/Gaw0vMeJ7x2pljdfsCyby0Rp
h4NqO2k6j8optr5WkH47UrP6fiB6mUbFBwm6OAvUhTRF61uPXUkUaYQch8oIQwW4
0Ij4aU95p3WToSfBdOXiHQKgrqthQvKwJZKnWfnH1w3VQT39uzPADm7+jLw06rpX
IeR/weWk5kPQas3jaN0hIEsV/TyjpOPqRlIpkvXCtJXuB1U3Ha0hh9FcF/Qccky5
RLIg/EqouWzVfgqoHejsgLX/lfweRYOYjXcsG1/OSgLDkVIrimkLxRpLKjs+QHlK
Bl8yI+HhlS1hA9AsVfY8DRpssIUszmmXpJBGYdcN5qDkZx6Rv811RcVUhaRHak3X
OL/0OA==
-----END CERTIFICATE-----
`},
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    AuthModule,
    ChatModule,
    SharedModule,
    DocumentsModule,
    JurisdictionsModule,
    TypeOrmModule.forFeature([Statute , Regulation , Status , Crons , Case , Message, Configuration]),
  ],
  controllers: [AppController],
  providers: [
    TasksService,
    AppService,
    EmbeddingService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports:[
    TasksService,
  ]
})
export class AppModule { }
