import { Injectable } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberInvoicesService {
  constructor(private jobberApi: JobberApiService) {}
}
