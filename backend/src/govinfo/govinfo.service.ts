import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GovInfoDocument } from '../auth/entities/govinfo.entity';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GovInfoService {
  private readonly baseUrl = 'https://api.govinfo.gov';
  private readonly apiKey = 'pMesSj0AqfdFHwHErhZFd4ZTdBmNGb76RwdA8lJ1';
  private readonly downloadPath = path.join(__dirname, '..', '..', 'uploads');

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(GovInfoDocument)
    private readonly govInfoRepo: Repository<GovInfoDocument>,
  ) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  async fetchAndStoreDocuments(collection: string, date: string): Promise<GovInfoDocument[]> {
    const url = `${this.baseUrl}/packages/${collection}/summary`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { api_key: this.apiKey },
        }),
      );

      const documents = response.data;
      const savedDocuments: GovInfoDocument[] = [];

      // Download PDF if available
      const pdfUrl = documents.download?.pdfLink;
      let localPdfUrl: string | null = null;

      if (pdfUrl) {
        try {
          // Download the PDF
          const pdfResponse = await firstValueFrom(
            this.httpService.get(pdfUrl, {
              params: { api_key: this.apiKey },
              responseType: 'arraybuffer'
            })
          );

          // Create filename from package ID
          const fileName = `${documents.packageId}.pdf`;
          const filePath = path.join(this.downloadPath, fileName);

          // Save PDF to disk
          fs.writeFileSync(filePath, pdfResponse.data);
          
          // Store the local URL
          localPdfUrl = `/uploads/${fileName}`;
        } catch (downloadError) {
          console.error('Error downloading PDF:', downloadError.message);
        }
      }

      const newDoc = this.govInfoRepo.create({
        package_id: documents.packageId,
        title: documents.title,
        date: documents.lastModified,
        collection: documents.collectionCode,
        data: documents,
        url: localPdfUrl ? [localPdfUrl] : []
      });

      const saved = await this.govInfoRepo.save(newDoc);
      savedDocuments.push(saved);

      return savedDocuments;
    } catch (error) {
      console.error('Error fetching data from GovInfo:', error.message);
      throw error;
    }
  }
}