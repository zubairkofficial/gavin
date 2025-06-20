// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as simpleGit from 'simple-git';
// import * as xml2js from 'xml2js';

// @Injectable()
// export class TasksService {
//   private readonly logger = new Logger(TasksService.name);

//   @Cron(CronExpression.EVERY_30_SECONDS) // For testing, change to EVERY_MINUTE if needed
//   async handleCron() {
//     const repoUrl = 'https://github.com/usgpo/bulk-data/blob/main/CFR-XML_User-Guide.md';
//     const cloneDir = path.join(__dirname, '..', '..', 'tmp-repo');
//     const outputDir = path.join(__dirname, '..', '..', 'data');

//     this.logger.debug('Cron started: Cloning and processing XML files...');

//     // Clean previous clone
//     if (fs.existsSync(cloneDir)) {
//       fs.rmSync(cloneDir, { recursive: true, force: true });
//     }

//     const git = simpleGit.default();

//     try {
//       // Clone the repo
//       await git.clone(repoUrl, cloneDir);
//       this.logger.log('Repository cloned.');

//       // Find XML files
//       const xmlFiles = this.getAllXmlFiles(cloneDir);

//       // Create output dir if not exists
//       if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir, { recursive: true });
//       }

//       const parser = new xml2js.Parser();

//       for (const filePath of xmlFiles) {
//         const xmlContent = fs.readFileSync(filePath, 'utf-8');
//         const jsonData = await parser.parseStringPromise(xmlContent);

//         const fileName = path.basename(filePath, '.xml') + '.json';
//         const outputPath = path.join(outputDir, fileName);

//         fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
//         this.logger.log(`Parsed and saved: ${fileName}`);
//       }

//       this.logger.log('All XML files processed successfully.');
//     } catch (error) {
//       this.logger.error('Error during XML processing:', error.message);
//     } finally {
//       // Clean up cloned repo
//       if (fs.existsSync(cloneDir)) {
//         fs.rmSync(cloneDir, { recursive: true, force: true });
//         this.logger.debug('Temporary clone removed.');
//       }
//     }
//   }

//   private getAllXmlFiles(dir: string, fileList: string[] = []): string[] {
//     const files = fs.readdirSync(dir);
//     for (const file of files) {
//       const fullPath = path.join(dir, file);
//       if (fs.statSync(fullPath).isDirectory()) {
//         this.getAllXmlFiles(fullPath, fileList);
//       } else if (file.toLowerCase().endsWith('.xml')) {
//         fileList.push(fullPath);
//       }
//     }
//     return fileList;
//   }
// }




import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { runTexasStatuteScraper } from '../scrape/states/taxes';
import { runDelawareCodeScraper } from 'scrape/states/delaware';
import { runNewYorkCodeScraper } from 'scrape/states/newyork';
import { processAllFloridaStatutes } from 'scrape/states/florida';
import { scrapeCaliforniaCodes } from 'scrape/states/california';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.debug('Called every 30 seconds');
    await runTexasStatuteScraper();
    await runDelawareCodeScraper();
    await runNewYorkCodeScraper();
    await  processAllFloridaStatutes();
    await  scrapeCaliforniaCodes();
  }
}


