import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuration } from '@/documents/entities/configuration.entity';
import { User } from '@/auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ Configuration , User]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfiModule {}
