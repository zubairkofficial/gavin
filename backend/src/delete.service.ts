import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './chat/entities/message.entity';
import { Repository, LessThanOrEqual, Not, IsNull, In } from 'typeorm';

@Injectable()
export class DeleteService {
  private readonly logger = new Logger(DeleteService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>
  ) {}

  // Runs on the 1st day of every month at 00:00 (midnight)
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