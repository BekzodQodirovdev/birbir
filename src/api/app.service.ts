import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from '../infrastructure/lib/index';

export class Application {
  static async main(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.use(cookieParser());
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
