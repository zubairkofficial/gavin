import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { JurisdictionsService } from './jurisdictions.service';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';
import { Jurisdiction } from './entities/jurisdiction.entity';
import { AuthGuard } from '@/auth/auth.guard';
import { data } from 'cheerio/dist/commonjs/api/attributes';

@Controller('jurisdictions')
@UseGuards(AuthGuard)
export class JurisdictionsController {
  constructor(private readonly jurisdictionsService: JurisdictionsService) {}

  @Post()

  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createJurisdictionDto: CreateJurisdictionDto , @Request() req: any,): Promise<Jurisdiction> {
    return await this.jurisdictionsService.create(createJurisdictionDto , req.user.id);
  }

  @Get()
  async findAll( @Request() req: any,): Promise<Jurisdiction[]> {

    return  await this.jurisdictionsService.findAll(req.user.id);
  }

  @Get('forall')
  async find( @Request() req: any,): Promise<Jurisdiction[]> {

    return  await this.jurisdictionsService.find();
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
