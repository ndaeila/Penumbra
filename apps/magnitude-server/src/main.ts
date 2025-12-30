import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3011;

  await app.listen(port);
}
bootstrap().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
