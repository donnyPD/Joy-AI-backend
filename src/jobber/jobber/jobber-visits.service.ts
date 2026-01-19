import { Injectable } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberVisitsService {
  constructor(private jobberApi: JobberApiService) {}
}
