// src/govinfo/govinfo.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { GovInfoService } from './govinfo.service';
import { Public } from '@/auth/decorators/public.decorator';

@Controller('govinfo')
export class GovInfoController {
  constructor(private readonly govInfoService: GovInfoService) {}
  @Public()
  @Get('fetch-and-store')
  fetchAndStore(
    @Query('collection') collection: string,
    @Query('date') date: string,
  ) {
    return this.govInfoService.fetchAndStoreDocuments(collection, date);
  }
  @Public()
  @Get('get-name')
  getName() {
    return 'GovInfo Service';
  }
}
