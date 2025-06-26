import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {  CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { runTexasStatuteScraper } from '../scrape/states/taxes';
import { runDelawareCodeScraper } from 'scrape/states/delaware';
import { runNewYorkCodeScraper } from 'scrape/states/newyork';
import { processAllFloridaStatutes } from 'scrape/states/florida';
import { scrapeCaliforniaCodes } from 'scrape/states/california';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statute } from '../src/documents/entities/statute.entity';
import { EmbeddingService } from './documents/services/embedding.service';
import { parseXmlTitlesFromRepo } from '../scrape/gitScrape';
import { Regulation } from './documents/entities/regulation.entity';
import { openBrowser } from 'scrape/usCodesScraper';
import { Cron } from './cron.entity';


export interface CronJobInfo {
  name: any;
  cronTime: string;
  lastDate: string | null;
}

@Injectable()
export class TasksService implements OnModuleInit {
// export class TasksService {
  constructor(
    @InjectRepository(Statute)
    private readonly statuteRepository: Repository<Statute>,
    @InjectRepository(Regulation)
    private regulationRepository: Repository<Regulation>,
    @InjectRepository(Cron)
    private cronRepository: Repository<Cron>,
    private embeddingService: EmbeddingService,
    private schedulerRegistry: SchedulerRegistry
  ) { }

  private readonly logger = new Logger(TasksService.name);


  async onModuleInit(){

    const crons = await this.cronRepository.find()
    console.log(crons)
    for(const cron of crons){
      this.addCronJob(cron.jobName, cron.cronExpresion)
    }

  }

  // @Cron('0 0 1,15 * *')
  // async handleCron() {
  //   this.logger.debug('Scraping starts at midnight (00:00) on the 1st and 15th day of every month, which approximates "every 15 days."');
  //   this.scrape();
  // }

   private jobCallbackFactory(jobName: string): () => void {
    return () => {
      const now = new Date().toISOString();
      this.logger.debug(`Running job: ${jobName} at ${now}`);
      this.scrape(); // Call the method you want
    };
  }


  addCronJob(jobName: string, cronTime: string): string {

    if (!cronTime || typeof cronTime !== 'string') {
    return ('Invalid or missing cron expression');
  }
  if (this.schedulerRegistry.doesExist('cron', jobName)) {
    return `Job '${jobName}' already exists.`;
  }

  const job = new CronJob(cronTime, this.jobCallbackFactory(jobName));
  this.schedulerRegistry.addCronJob(jobName, job);
  job.start();

  return `Added job: ${jobName} with schedule: ${cronTime}`;
}


  

getCronJobs(): CronJobInfo[] {
  const jobs = this.schedulerRegistry.getCronJobs();
  const jobDetails: CronJobInfo[] = [];

  jobs.forEach((job: CronJob, name: any) => {
    jobDetails.push({
      name,
      cronTime: typeof job.cronTime.source === 'string' ? job.cronTime.source : job.cronTime.source.toString(), // ensure string
      lastDate: job.lastDate()?.toISOString() || null,
      
    });
  });

  return jobDetails;
}


deleteCronJob(jobName: string): string {
    if (!this.schedulerRegistry.doesExist('cron', jobName)) {
      return `Job '${jobName}' does not exist.`;
    }

    this.schedulerRegistry.deleteCronJob(jobName);
    return `Deleted job: ${jobName}`;
  }

  async scrape() {

    this.logger.log('Deleting all statutes with source_url = "scaper"');
    await this.statuteRepository.delete({ source_url: 'scaper' });
    this.logger.log('Deleted all regulations with source_url = "scaper"');
    await this.regulationRepository.delete({ source_url: 'scaper' });
    this.logger.log('Deleting all embadings with source_url = "scaper"');
    await this.embeddingService.deleteDocumentEmbadings('Scraper');


    for await (const { title, content , url} of processAllFloridaStatutes()) {
      this.logger.log(`Processing Florida statute: ${title} and contat ${content.length}`);

      const domain = new URL(url).hostname; // "www.leg.state.fl.us"
const filename = url.substring(url.lastIndexOf('/') + 1); // "0001.html"

const finalPath = `${domain}/${filename}`;
      const statute = new Statute();
      statute.title = title;
      statute.content_html = content;
      statute.jurisdiction = 'Florida';
      statute.source_url = 'scaper';
      statute.fileName = finalPath; 
      statute.type = 'statute';
      statute.filePath = url; 


      const document = await this.statuteRepository.save(statute);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source: 'Scraper',
        }
      });
    }


    for await (const { url, content, code, section, Title, subject_area , decision_date } of scrapeCaliforniaCodes()) {


    const statute = new Statute();
    statute.content_html = content;
    statute.source_url = 'scaper';
    statute.fileName = url.split('/').pop() || '';
    statute.title = Title ;
    statute.section = section ;
    statute.code = code ;
    statute.jurisdiction = 'California';
    statute.type = 'statute'; 
    statute.holding_summary = subject_area ;
    statute.filePath = url ;
    statute.decision_date =
  decision_date && !isNaN(new Date(decision_date).getTime())
    ? new Date(decision_date).toISOString()
    : '';



    const document = await this.statuteRepository.save(statute);

    await this.embeddingService.processDocument({
      documentId: document.id,
      content: document.content_html || '',
      additionalMetadata: {
        document_id: document.id,
        processed_at: new Date().toISOString(),
        enabled: true,
        source: 'Scraper',
      }
    });
  }

    for await (const statuteData of runTexasStatuteScraper()) {
      // Process each statuteData as soon as it is available
      this.logger.log(`Processing statute: ${JSON.stringify(statuteData)}`);
      const StatuteEntity = new Statute();
      StatuteEntity.code = statuteData.code;
      StatuteEntity.title = statuteData.chapter;
      StatuteEntity.type = 'statute';

      StatuteEntity.content_html = statuteData.content || '';
      StatuteEntity.source_url = 'scaper';

      const document = await this.statuteRepository.save(StatuteEntity);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source: 'Scraper',
        }
      });



    }

    for await (const codeData of runDelawareCodeScraper()) {
      // Process each codeData as soon as it is available
      this.logger.log(`Processing Delaware code: ${JSON.stringify(codeData)}`);
      const StatuteEntity = new Statute();
      StatuteEntity.code = codeData.titleNumber;
      StatuteEntity.title = codeData.title;
      StatuteEntity.type = 'statute';
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
          source: 'Scraper',
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
      StatuteEntity.type = 'statute';
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
          source: 'Scraper',
        }
      });
    }

    

    for await (const regulationData of parseXmlTitlesFromRepo()) {
      // this.logger.log(`Processing statute: ${JSON.stringify(statuteData)}`);
      const RegulationEntity = new Regulation();
      RegulationEntity.title = regulationData.title || '';
      RegulationEntity.content_html = regulationData.contant;
      RegulationEntity.type = 'regulation';
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
          source: 'Scraper',
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
      StatuteEntity.title = parsedData.title;
      StatuteEntity.type = 'statute';
      StatuteEntity.section = parsedData.section || '';
      StatuteEntity.citation = parsedData.citation || '';
      StatuteEntity.content_html = parsedData.data || '';
      StatuteEntity.source_url = 'scaper';

      // Ensure content_html is defined

      // Save to database
      const document = await this.statuteRepository.save(StatuteEntity);

      await this.embeddingService.processDocument({
        documentId: document.id,
        content: document.content_html || '',
        additionalMetadata: {
          document_id: document.id,
          processed_at: new Date().toISOString(),
          enabled: true,
          source: 'Scraper',
        }
      });
    }
  }
}


