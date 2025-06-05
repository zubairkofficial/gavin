// src/govinfo/govinfo.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { GovInfoService } from './govinfo.service';

@Controller('govinfo')
export class GovInfoController {
  constructor(private readonly govInfoService: GovInfoService) {}

  @Get('fetch-and-store')
  fetchAndStore(
    @Query('collection') collection: string,
    @Query('date') date: string,
  ) {
    return this.govInfoService.fetchAndStoreDocuments(collection, date);
  }
}
