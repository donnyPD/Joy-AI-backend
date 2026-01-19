import { Test, TestingModule } from '@nestjs/testing';
import { JobberClientsService } from './jobber-clients.service';

describe('JobberClientsService', () => {
  let service: JobberClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobberClientsService],
    }).compile();

    service = module.get<JobberClientsService>(JobberClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
