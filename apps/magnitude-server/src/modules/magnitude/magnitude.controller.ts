import { Controller, Post, Param, Body } from '@nestjs/common';
import { MagnitudeService } from './magnitude.service';

@Controller('api/magnitude')
export class MagnitudeController {
  constructor(private readonly magnitudeService: MagnitudeService) {}

  @Post('extract-search-results')
  async extractSearchResults(@Body() body: { query: string }) {
    return this.magnitudeService.extractSearchResults(body.query);
  }
}
