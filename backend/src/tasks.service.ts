import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { runTexasStatuteScraper } from '../scrape/states/taxes';
import { runDelawareCodeScraper } from 'scrape/states/delaware';
import { runNewYorkCodeScraper } from 'scrape/states/newyork';
import { processAllFloridaStatutes } from 'scrape/states/florida';
import { scrapeCaliforniaCodes } from 'scrape/states/california';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statute } from '../src/documents/entities/statute.entity';
import { EmbeddingService } from './documents/services/embedding.service';
import  {parseXmlTitlesFromRepo}  from '../scrape/gitScrape';
import { Regulation } from './documents/entities/regulation.entity';
import { openBrowser } from 'scrape/usCodesScraper';
@Injectable()
// export class TasksService implements OnModuleInit {
export class TasksService  {
  constructor(
    @InjectRepository(Statute)
    private readonly statuteRepository: Repository<Statute>,
    @InjectRepository(Regulation)
        private regulationRepository: Repository<Regulation>,
     private embeddingService: EmbeddingService,
    @InjectRepository(Regulation)
        private regulationRepository: Repository<Regulation>,
     private embeddingService: EmbeddingService,
  ) { }

  private readonly logger = new Logger(TasksService.name);


  @Cron('0 0 1,15 * *')
  async handleCron() {
    this.logger.debug('Scraping starts at midnight (00:00) on the 1st and 15th day of every month, which approximates "every 15 days."');
    this.scrape();
  }

  async scrape() {
    // for await (const statuteData of runTexasStatuteScraper()) {
    //   // Process each statuteData as soon as it is available
    //   this.logger.log(`Processing statute: ${JSON.stringify(statuteData)}`);
    //   const StatuteEntity = new Statute();
    //   StatuteEntity.code = statuteData.code;
    //   StatuteEntity.title = statuteData.chapter;
    //   StatuteEntity.content_html = statuteData.content || '';
    //   StatuteEntity.source_url = 'scaper';

     const document =  await this.statuteRepository.save(StatuteEntity);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {  
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source :  'Scraper',
        }
      });



    }

    for await (const codeData of runDelawareCodeScraper()) {
      // Process each codeData as soon as it is available
      this.logger.log(`Processing Delaware code: ${JSON.stringify(codeData)}`);
      const StatuteEntity = new Statute();
      StatuteEntity.code = codeData.titleNumber;
      StatuteEntity.title = codeData.title;
      StatuteEntity.content_html = codeData.content;
      StatuteEntity.source_url = 'scaper';

      // Save to database
     const document = await this.statuteRepository.save(StatuteEntity);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {  
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source :  'Scraper',
        }
      });
    }

    for await (const sectionData of runNewYorkCodeScraper()) {
      // Process each sectionData as soon as it is available
      this.logger.log(`Processing NY statute: ${JSON.stringify(sectionData)}`);
      const StatuteEntity = new Statute();
      StatuteEntity.code = sectionData.code;
      StatuteEntity.title = sectionData.chapter;
      StatuteEntity.content_html = sectionData.section;
      StatuteEntity.source_url = 'scaper';

      // Save to database
     const document = await this.statuteRepository.save(StatuteEntity);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {  
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source :  'Scraper',
        }
      });
    }

    for await (const { title, content } of processAllFloridaStatutes()) {
      this.logger.log(`Processing Florida statute: ${title}`);
      const statute = new Statute();
      statute.title = title;
      statute.content_html = content;

     const document = await this.statuteRepository.save(statute);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {  
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source :  'Scraper',
        }
      });
    }

    for await (const { url, content } of scrapeCaliforniaCodes()) {
      this.logger.log(`Processing California code section: ${url}`);
      const statute = new Statute();
      statute.content_html = content;
      statute.source_url = 'scaper';
      // Add other fields if needed

    const document =  await this.statuteRepository.save(statute);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {  
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source :  'Scraper',
        }
      });
    }

for await (const regulationData of parseXmlTitlesFromRepo()) {
  // this.logger.log(`Processing statute: ${JSON.stringify(statuteData)}`);
  const RegulationEntity = new Regulation();
  RegulationEntity.title = regulationData.title || '';
  RegulationEntity.content_html = regulationData.contant;
  RegulationEntity.fileName = regulationData.file;
  RegulationEntity.source_url = 'scaper';

  const document = await this.regulationRepository.save(RegulationEntity);

  await this.embeddingService.processDocument({
    documentId: document.id,
    content: document.content_html || '',
    additionalMetadata: {  
      document_id: document.id,
      processed_at: new Date().toISOString(),
      enabled: true,
      source :  'Scraper',
    }
  });
}

    console.log('Scraping US Codes...');

     for await (const parsedData of openBrowser()) {
            console.log('Received parsed data:', {
                fileName: parsedData.fileName,
                title: parsedData.title,
                hasError: !!parsedData.error,
                section: parsedData.section,
                citation: parsedData.citation,
                data: parsedData.data
            });
           const StatuteEntity = new Statute();
      StatuteEntity.fileName = parsedData.fileName;
      StatuteEntity.title = parsedData.title ;
      StatuteEntity.section = parsedData.section || '';
      StatuteEntity.citation = parsedData.citation || '';
      StatuteEntity.content_html = parsedData.data  || '';
      StatuteEntity.source_url = 'scaper';

      // Ensure content_html is defined

      // Save to database
     const document =  await this.statuteRepository.save(StatuteEntity);

      // await this.embeddingService.processDocument({
      //   documentId: document.id,
      //   content: document.content_html || '',
      //   additionalMetadata: {  
      //     document_id: document.id,
      //     processed_at: new Date().toISOString(),
      //     enabled: true,
      //     source :  'Scraper',
      //   }
      // });
       }
  }
}


