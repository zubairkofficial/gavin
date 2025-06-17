import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JurisdictionsService } from './jurisdictions.service';
import { JurisdictionsController } from './jurisdictions.controller';
import { Jurisdiction } from './entities/jurisdiction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Jurisdiction])],
  controllers: [JurisdictionsController],
  providers: [JurisdictionsService],
})
export class JurisdictionsModule {}
