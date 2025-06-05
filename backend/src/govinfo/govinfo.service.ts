// src/govinfo/govinfo.service.ts

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GovInfoDocument } from '../auth/entities/govinfo.entity'; // Adjust the import path as necessary
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GovInfoService {
  private readonly baseUrl = 'https://api.govinfo.gov';
  private readonly apiKey = 'pMesSj0AqfdFHwHErhZFd4ZTdBmNGb76RwdA8lJ1'; // Replace with your actual API key

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(GovInfoDocument)
    private readonly govInfoRepo: Repository<GovInfoDocument>,
  ) {}

  async fetchAndStoreDocuments(collection: string, date: string): Promise<GovInfoDocument[]> {
    const url = `${this.baseUrl}/collections/${collection}/${date}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { api_key: this.apiKey },
        }),
      );

      const documents = response.data?.packages || [];

      const savedDocuments: GovInfoDocument[] = [];

      for (const doc of documents) {
        const newDoc = this.govInfoRepo.create({
          package_id: doc.packageId,
          title: doc.title,
          date: doc.dateIssued,
          collection: doc.collectionCode,
          data: doc,
        });
        const saved = await this.govInfoRepo.save(newDoc);
        savedDocuments.push(saved);
      }

      return savedDocuments;
    } catch (error) {
      console.error('Error fetching data from GovInfo:', error.message);
      throw error;
    }
  }
}
