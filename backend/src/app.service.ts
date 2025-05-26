import { Injectable } from '@nestjs/common';
import { JWTPayload } from './common/types';

@Injectable()
export class AppService {
  getHello(JWTPayload?: JWTPayload): string {
    return JWTPayload
      ? `Hello ${JWTPayload.id ? JWTPayload.role : 'stranger'}!`
      : 'Hello World!';
  }
}
