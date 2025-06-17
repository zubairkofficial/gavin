import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jurisdiction } from './entities/jurisdiction.entity';

@Injectable()
export class JurisdictionsService {
  constructor(
    @InjectRepository(Jurisdiction)
    private jurisdictionRepository: Repository<Jurisdiction>,
  ) {}

  async create(createJurisdictionDto: CreateJurisdictionDto): Promise<Jurisdiction> {
    const jurisdiction = new Jurisdiction();
    jurisdiction.jurisdiction = createJurisdictionDto.jurisdiction;
    return await this.jurisdictionRepository.save(jurisdiction);
  }

  async findAll(): Promise<Jurisdiction[]> {
    return await this.jurisdictionRepository.find();
  }

  async findOne(id: string): Promise<Jurisdiction> {
    const jurisdiction = await this.jurisdictionRepository.findOne({
      where: { id }
    });
    if (!jurisdiction) {
      throw new NotFoundException(`Jurisdiction with ID ${id} not found`);
    }
    return jurisdiction;
  }

  async update(id: string, updateJurisdictionDto: UpdateJurisdictionDto): Promise<Jurisdiction> {
    const jurisdiction = await this.findOne(id);
    if (updateJurisdictionDto.jurisdiction) {
      jurisdiction.jurisdiction = updateJurisdictionDto.jurisdiction;
    }
    return await this.jurisdictionRepository.save(jurisdiction);
  }

  async remove(id: string): Promise<void> {
    const result = await this.jurisdictionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Jurisdiction with ID ${id} not found`);
    }
  }
}
