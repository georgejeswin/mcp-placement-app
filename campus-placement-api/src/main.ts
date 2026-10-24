import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('Campus Placement API')
    .setDescription('Students preparing for campus placement')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
  Logger.log(`Campus Placement API on http://localhost:${port} (docs at /docs)`, 'Bootstrap');
}
bootstrap().catch((err: unknown) => {
  Logger.error(err, 'Bootstrap');
  process.exit(1);
});
