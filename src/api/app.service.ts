import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../infrastructure/lib/index';
import { IoAdapter } from '@nestjs/platform-socket.io';

export class Application {
  static async main(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    app.useWebSocketAdapter(new IoAdapter(app));
    app.setGlobalPrefix('api');
    app.use(cookieParser());

    // Security headers with Helmet
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      xFrameOptions: { action: 'deny' },
    }));

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.enableCors({
      origin: '*',
      methods: 'GET,POST,PUT,DELETE',
      allowedHeaders: 'Content-Type, Authorization',
    });
    const config = new DocumentBuilder()
      .setTitle('Bir Bir')
      .setDescription('App description here')
      .setVersion('1.0')
      .addTag('Bir Bir')
      .addBearerAuth({
        type: 'http',
        scheme: 'Bearer',
        in: 'Header',
      })
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory);

    await app.listen(process.env.PORT ?? 4000);
  }
}
