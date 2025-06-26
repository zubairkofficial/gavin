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
import { Cron } from './cron.entity';


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
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    AuthModule,
    SharedModule,
    DocumentsModule,
    JurisdictionsModule,
    TypeOrmModule.forFeature([Statute , Regulation , Status , Cron]),
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
export class AppModule {}
