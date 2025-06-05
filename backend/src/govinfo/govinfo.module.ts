// src/govinfo/govinfo.module.ts

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovInfoController } from './govinfo.controller';
import { GovInfoService } from './govinfo.service';
import { GovInfoDocument } from '../auth/entities/govinfo.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([GovInfoDocument])
  ],
  controllers: [GovInfoController],
  providers: [GovInfoService]
})
export class GovInfoModule {}
