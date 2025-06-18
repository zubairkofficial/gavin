import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { JurisdictionsService } from './jurisdictions.service';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';
import { Jurisdiction } from './entities/jurisdiction.entity';

@Controller('jurisdictions')
export class JurisdictionsController {
  constructor(private readonly jurisdictionsService: JurisdictionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createJurisdictionDto: CreateJurisdictionDto): Promise<Jurisdiction> {
    return await this.jurisdictionsService.create(createJurisdictionDto);
  }

  @Get()
  async findAll(): Promise<Jurisdiction[]> {
    return await this.jurisdictionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Jurisdiction> {
    return await this.jurisdictionsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJurisdictionDto: UpdateJurisdictionDto,
  ): Promise<Jurisdiction> {
    return await this.jurisdictionsService.update(id, updateJurisdictionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.jurisdictionsService.remove(id);
  }
}
