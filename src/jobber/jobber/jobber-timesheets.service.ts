import { Injectable, Logger } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberTimesheetsService {
  private readonly logger = new Logger(JobberTimesheetsService.name);

  constructor(private jobberApi: JobberApiService) {}

  async getTimesheetEntryDetails(entryId: string, accessToken?: string) {
    const query = `
      query GetTimeSheetEntry($id: EncodedId!) {
        timeSheetEntry(id: $id) {
          id
          createdAt
          updatedAt
          startAt
          endAt
          duration
          note
          job {
            id
            jobNumber
            title
          }
          client {
            id
            name
          }
          user {
            id
            name {
              first
              last
            }
          }
        }
      }
    `;

    const response = await this.jobberApi.execute<{ data: { timeSheetEntry: unknown } }>(
      query,
      { id: entryId },
      accessToken,
    );
    return response.data;
  }
}
