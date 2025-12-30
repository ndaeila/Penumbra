import { Module } from '@nestjs/common';
import { MagnitudeController } from './magnitude.controller';

@Module({
  controllers: [MagnitudeController],
})
export class MagnitudeModule {}
