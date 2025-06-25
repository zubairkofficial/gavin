import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as path from 'path';

const logger = new Logger('main.ts');
const port = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigin = configService.get<string>('FRONTEND_URL');
      const devMode = configService.get<string>('NODE_ENV') === 'development';
      if (devMode) return callback(null, true);
      if (!origin || !allowedOrigin) {
        return callback(null, true);
      }
      if (allowedOrigin.indexOf(origin) === -1) {
        return callback(new BadRequestException('Not allowed by CORS'));
      }
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());

  const uploadPath = path.join(__dirname, '..','..','uploads')
  logger.log(`Upload path: ${uploadPath}`);
  // logger.log(`Serving static files from ${uploadPath}`);
  app.useStaticAssets(uploadPath, {
    prefix: '/api/v1/static/files/', // URL prefix for accessing the files
  });

  app.setGlobalPrefix('/api/v1');  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      enableDebugMessages: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gavin Backend')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);

  logger.log(`Application is listening on port ${port}`);
  logger.log(`Swagger docs live on ${process.env.HOST}:${port || 3000}/docs`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
