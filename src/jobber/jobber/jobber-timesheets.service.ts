import { Injectable } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberTimesheetsService {
  constructor(private jobberApi: JobberApiService) {}
}
