import { Injectable, Logger } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberVisitsService {
  private readonly logger = new Logger(JobberVisitsService.name);

  constructor(private jobberApi: JobberApiService) {}

  async getVisitDetails(visitId: string, accessToken?: string) {
    const query = `
      query GetVisitDetails($id: EncodedId!) {
        visit(id: $id) {
          id
          title
          visitStatus
          startAt
          endAt
          createdAt
          instructions
          assignedUsers {
            nodes {
              id
              name { first last }
            }
            totalCount
          }
          job {
            id
            jobType
            jobNumber
            title
            jobStatus
            startAt
            endAt
            createdAt
            updatedAt
            total
            customFields {
              ... on CustomFieldText { id label valueText }
              ... on CustomFieldNumeric { id label valueNumeric }
              ... on CustomFieldDropdown { id label valueDropdown }
              ... on CustomFieldArea { id label valueArea { length width } }
              ... on CustomFieldLink { id label valueLink { text url } }
            }
            client {
              id
              firstName
              lastName
              companyName
              emails { address primary }
              phones { number primary }
            }
            property {
              id
              name
              address {
                street
                street2
                city
                postalCode
                province
                country
              }
            }
          }
          lineItems(first: 100) {
            nodes {
              id
              name
              description
              qty
              unitPrice
              totalPrice
            }
            totalCount
          }
        }
      }
    `;

    const response = await this.jobberApi.execute<{ data: { visit: unknown } }>(
      query,
      { id: visitId },
      accessToken,
    );
    return response.data;
  }
}
