import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const JWTUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request?.user || null;
  },
);
