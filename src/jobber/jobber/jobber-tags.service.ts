import { Injectable } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberTagsService {
  constructor(private jobberApi: JobberApiService) {}
}
