import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { runTexasStatuteScraper } from '../scrape/states/taxes';
import { runDelawareCodeScraper } from 'scrape/states/delaware';
import { runNewYorkCodeScraper } from 'scrape/states/newyork';
import { processAllFloridaStatutes } from 'scrape/states/florida';
import { scrapeCaliforniaCodes } from 'scrape/states/california';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Statute } from '../src/documents/entities/statute.entity';
import { EmbeddingService } from './documents/services/embedding.service';
import { parseXmlTitlesFromRepo } from '../scrape/gitScrape';
import { Regulation } from './documents/entities/regulation.entity';
import { openBrowser } from 'scrape/usCodesScraper';
import { Crons } from './cron.entity';
import { Cron } from '@nestjs/schedule';
import { scrapeCourtListener } from 'scrape/CourtListner';
import { Case } from './documents/entities/case.entity';
import { Message } from './chat/entities/message.entity';


export interface CronJobInfo {
  name: any;
  cronTime: string;
  lastDate: string | null;
}

@Injectable()

export class DeleteService {
  private readonly logger = new Logger(DeleteService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async permanentDeleteExpiredMessages(): Promise<void> {
    this.logger.log('Starting permanent deletion of expired messages...');

    try {
      // Calculate the cutoff date (30 days ago from now)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find messages that have deletedAt timestamp and are older than 30 days
      const expiredMessages = await this.messageRepository.createQueryBuilder('message')
        .where('message.deletedAt IS NOT NULL')
        .andWhere('message.deletedAt <= :thirtyDaysAgo', { thirtyDaysAgo })
        .getMany();

      if (expiredMessages.length === 0) {
        this.logger.log('No expired messages found for permanent deletion');
        return;
      }

      this.logger.log(`Found ${expiredMessages.length} expired messages for permanent deletion`);

      // Extract message IDs
      const messageIds = expiredMessages.map(message => message.id);

      // Perform permanent deletion (hard delete)
      const deleteResult = await this.messageRepository.delete({
        id: In(messageIds)
      });

      this.logger.log(`Successfully permanently deleted ${deleteResult.affected || 0} messages`);

    } catch (error) {
      this.logger.error('Error during permanent deletion of expired messages:', error.stack);
      // Instead of throwing, we log the error since this is a scheduled task
      // We don't want the application to crash if deletion fails
      return;
    }
  }
}
export class TasksService implements OnModuleInit {
  // export class TasksService {
  constructor(
    @InjectRepository(Statute)
    private readonly statuteRepository: Repository<Statute>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Regulation)
    private regulationRepository: Repository<Regulation>,
    @InjectRepository(Crons)
    private cronRepository: Repository<Crons>,
    private embeddingService: EmbeddingService,
    private schedulerRegistry: SchedulerRegistry
  ) { }

  private readonly logger = new Logger(TasksService.name);


  async onModuleInit() {
    const crons = await this.cronRepository.find();
    // console.log('Fetched Cron Jobs:', crons);

    for (const cron of crons) {
      // console.log(`Checking cron expression: ${cron.cronExpresion}`);

      if (!this.isValidCronExpression(cron.cronExpresion)) {
        this.logger.error(`Invalid cron expression: ${cron.cronExpresion}`);
        continue;  // Skip invalid cron expressions
      }

      this.addCronJob( cron.jobName , cron.cronExpresion);
    }
  }

  private isValidCronExpression(cronExp: string): boolean {
    const cronPattern = /^([0-5]?\d|\*) ([01]?\d|2[0-3]|\*) ([0-3]?\d|\*) ([01]?\d|\*) ([0-6]|\*)$/;
    return cronPattern.test(cronExp);
  }

  // @Cron('0 0 1,15 * *')
  // async handleCron() {
  //   this.logger.debug('Scraping starts at midnight (00:00) on the 1st and 15th day of every month, which approximates "every 15 days."');
  //   this.scrape();
  // }


  // @Cron(CronExpression.)
  // handleCron() {
  //   this.logger.debug('Called every 30 seconds');
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

    const job = new CronJob(
      cronTime,
      this.jobCallbackFactory(jobName),
      null,
      false,
      'local'
    );
    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();

    const message = `Added job: ${jobName} with schedule: ${cronTime}`;
    return message;
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


  async deleteCronJob(jobName: string): Promise<string> {
    if (!this.schedulerRegistry.doesExist('cron', jobName)) {
      return `Job '${jobName}' does not exist.`;
    }

    const result = await this.cronRepository.delete( { jobName :  jobName })
    // console.log(result)
    if (!result) {
      // console.log( `Deleted job from scheduler, but no record found in DB for '${jobName}'.`);
    }

    this.schedulerRegistry.deleteCronJob(jobName);
    return `Deleted job: ${jobName}`;
  }

  async scrape() {

    this.logger.log('Deleting all statutes with source_url = "scaper"');
    await this.statuteRepository.delete({ source_url: 'scaper' });
    this.logger.log('Deleted all regulations with source_url = "scaper"');
    await this.regulationRepository.delete({ source_url: 'scaper' });
    this.logger.log('Deleted all cases with source_url = "api"');
    await this.caseRepository.delete({ source_url: 'Api' });
    this.logger.log('Deleting all embadings with source_url = "scaper"');
    await this.embeddingService.deleteDocumentEmbadings('Scraper');




    // for await (const { url, content, code, section, Title, subject_area } of scrapeCaliforniaCodes()) {


    //   const statute = new Statute();
    //   statute.content_html = content;
    //   statute.source_url = 'scaper';
    //   statute.fileName = url.split('/').pop() || '';
    //   statute.title = Title;
    //   statute.section = section;
    //   statute.code = code;
    //   statute.jurisdiction = 'California';
    //   statute.type = 'statute';
    //   statute.holding_summary = subject_area;
    //   statute.filePath = url;



    //   const document = await this.statuteRepository.save(statute);

    //   await this.embeddingService.processDocument({
    //     documentId: document.id,
    //     content: document.content_html || '',
    //     additionalMetadata: {
    //       document_id: document.id,
    //       document_type: document.type,
    //       processed_at: new Date().toISOString(),
    //       enabled: true,
    //       source: 'Scraper',
    //       jurisdiction : 'CA'
    //     }
    //   });
    // }

    // for await (const data of scrapeCourtListener()) {
    //   //   console.log(data); // Each plain_text as soon as it's available
    //   // console.log('='.repeat(60))
    //   // console.log('scraping started')
    //   // console.log('te all data of ',data.text)
    //   // console.log(data.filePath)
    //   // console.log(data.id)
    //   // console.log(data.type)
    //   // console.log(data.pageCount)
    //   // console.log(data.opinions_cited)
    //   // console.log(data.text)   


    //   const cases = new Case();
    //   cases.content_html = data.text;
    //   cases.source_url = 'Api';
    //   cases.name = data.filePath.split('//')[1];
    //   cases.filePath = data.filePath;
    //   cases.case_type = data.type;
    //   cases.type = 'case';
    //   cases.jurisdiction = '';



    //   const document = await this.caseRepository.save(cases);

    //   await this.embeddingService.processDocument({
    //     documentId: document.id,
    //     content: document.content_html || '',
    //     additionalMetadata: {
    //       document_id: document.id,
    //       document_type: document.type,
    //       processed_at: new Date().toISOString(),
    //       enabled: true,
    //       source: 'Api',
    //       jurisdiction : '',
    //     }
    //   });
    // }






    // for await (const { title, content, url } of processAllFloridaStatutes()) {
    //   this.logger.log(`Processing Florida statute: ${title} and contat ${content.length}`);

    //   const domain = new URL(url).hostname; // "www.leg.state.fl.us"
    //   const filename = url.substring(url.lastIndexOf('/') + 1); // "0001.html"

    //   const finalPath = `${domain}/${filename}`;
    //   const statute = new Statute();
    //   statute.title = title;
    //   statute.content_html = content;
    //   statute.jurisdiction = 'Florida';
    //   statute.source_url = 'scaper';
    //   statute.fileName = finalPath;
    //   statute.type = 'statute';
    //   statute.filePath = url;


    //   const document = await this.statuteRepository.save(statute);

    //   await this.embeddingService.processDocument({
    //     documentId: document.id,
    //     content: document.content_html || '',
    //     additionalMetadata: {
    //       document_id: document.id,
    //       document_type: document.type,
    //       processed_at: new Date().toISOString(),
    //       enabled: true,
    //       source: 'Scraper',
    //       jurisdiction : 'FL'
    //     }
    //   });
    // }


    for await (const statuteData of runTexasStatuteScraper()) {
      // Process each statuteData as soon as it is available
      this.logger.log(`Processing statute: ${JSON.stringify(statuteData)}`);
      const StatuteEntity = new Statute();
      StatuteEntity.code = statuteData.code;
      StatuteEntity.title = statuteData.chapter;
      StatuteEntity.fileName = statuteData.fileName;
      StatuteEntity.type = 'statute';
      StatuteEntity.jurisdiction = 'Texas';
      StatuteEntity.filePath = statuteData.url;
      StatuteEntity.content_html = statuteData.content || '';
      StatuteEntity.source_url = 'scaper';

      const document = await this.statuteRepository.save(StatuteEntity);

      // await this.embeddingService.processDocument({
      //   documentId: document.id,
      //   content: document.content_html || '',
      //   additionalMetadata: {
      //     document_id: document.id,
      //     document_type: document.type,
      //     processed_at: new Date().toISOString(),
      //     enabled: true,
      //     source: 'Scraper',
      //     jurisdiction : 'TE'
      //   }
      // });


    }

    for await (const codeData of runDelawareCodeScraper()) {
      // Process each codeData as soon as it is available
      this.logger.log(`Processing Delaware code: ${JSON.stringify(codeData)}`);
      const StatuteEntity = new Statute();
      StatuteEntity.code = codeData.titleNumber;
      StatuteEntity.title = codeData.title;
      StatuteEntity.fileName = codeData.fileName || '';
      StatuteEntity.type = 'statute';
      StatuteEntity.filePath = codeData.filePath;
      StatuteEntity.jurisdiction = 'delaware';
      StatuteEntity.content_html = codeData.content;
      StatuteEntity.source_url = 'scaper';

      // Save to database
      const document = await this.statuteRepository.save(StatuteEntity);

      // await this.embeddingService.processDocument({
      //   documentId: document.id,
      //   content: document.content_html || '',
      //   additionalMetadata: {
      //     document_id: document.id,
      //     document_type: document.type,
      //     processed_at: new Date().toISOString(),
      //     enabled: true,
      //     source: 'Scraper',
      //     jurisdiction : 'DE'
      //   }
      // });
    }

    for await (const sectionData of runNewYorkCodeScraper()) {
      // Process each sectionData as soon as it is available
      this.logger.log(`Processing NY statute: ${JSON.stringify(sectionData)}`);
      const StatuteEntity = new Statute();
      StatuteEntity.code = sectionData.code;
      StatuteEntity.title = sectionData.chapter;
      StatuteEntity.fileName = sectionData.fileName || '';
      StatuteEntity.holding_summary = sectionData.subject_area || '';
      StatuteEntity.filePath = sectionData.filePath || '';
      StatuteEntity.content_html = sectionData.section;
      // StatuteEntity.filePath = sectionData.filePath;
      StatuteEntity.type = 'statute';
      StatuteEntity.jurisdiction = 'NewYork';
      StatuteEntity.source_url = 'scaper';

      // Save to database
      const document = await this.statuteRepository.save(StatuteEntity);

      // await this.embeddingService.processDocument({
      //   documentId: document.id,
      //   content: document.content_html || '',
      //   additionalMetadata: {
      //     document_id: document.id,
      //     document_type: document.type,
      //     processed_at: new Date().toISOString(),
      //     enabled: true,
      //     source: 'Scraper',
      //     jurisdiction : 'NY'
      //   }
      // });
    }



    for await (const regulationData of parseXmlTitlesFromRepo()) {
      // this.logger.log(`Processing statute: ${JSON.stringify(statuteData)}`);
      const RegulationEntity = new Regulation();
      RegulationEntity.title = regulationData.title || '';
      RegulationEntity.content_html = regulationData.contant;
      RegulationEntity.type = 'regulation';
      RegulationEntity.jurisdiction = 'federal';
      RegulationEntity.filePath = regulationData.repoUrl || '';
      RegulationEntity.fileName = regulationData.file;
      RegulationEntity.source_url = 'scaper';

      const document = await this.regulationRepository.save(RegulationEntity);

      // await this.embeddingService.processDocument({
      //   documentId: document.id,
      //   content: document.content_html || '',
      //   additionalMetadata: {
      //     document_id: document.id,
      //     document_type: document.type,
      //     processed_at: new Date().toISOString(),
      //     enabled: true,
      //     source: 'Scraper',
      //     jurisdiction : 'FEDERAL',
      //   }
      // });
    }

    // console.log('Scraping US Codes...');

    for await (const parsedData of openBrowser()) {
      const StatuteEntity = new Statute();
      StatuteEntity.fileName = parsedData.fileName;
      StatuteEntity.title = parsedData.title;
      StatuteEntity.filePath = parsedData.filePath || '';
      StatuteEntity.type = 'statute';
      StatuteEntity.jurisdiction = 'federal';
      StatuteEntity.section = parsedData.section || '';
      StatuteEntity.citation = parsedData.citation || '';
      StatuteEntity.content_html = parsedData.data || '';
      StatuteEntity.source_url = 'scaper';

      // Ensure content_html is defined

      // Save to database
      const document = await this.statuteRepository.save(StatuteEntity);

      // await this.embeddingService.processDocument({
      //   documentId: document.id,
      //   content: document.content_html || '',
      //   additionalMetadata: {
      //     document_id: document.id,
      //     document_type: document.type,
      //     processed_at: new Date().toISOString(),
      //     enabled: true,
      //     source: 'Scraper',
      //     jurisdiction : 'FEDERAL'
      //   }
      // });
    }
  }
}


