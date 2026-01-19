import { Injectable, Logger } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberClientsService {
  private readonly logger = new Logger(JobberClientsService.name);

  constructor(private jobberApi: JobberApiService) {}

  async getClientDetails(clientId: string, accessToken?: string) {
    const query = `
      query GetClientDetails($id: EncodedId!) {
        client(id: $id) {
          id
          createdAt
          isCompany
          name
          companyName
          title
          firstName
          lastName
          notes(first: 100) {
            nodes {
              id
              message
            }
            totalCount
          }
          noteAttachments(first: 100) {
            nodes {
              id
            }
            totalCount
          }
          jobs(first: 100) {
            nodes {
              id
              jobNumber
              title
              jobStatus
              createdAt
              startAt
              endAt
            }
            totalCount
          }
          phones {
            number
            primary
            description
            smsAllowed
          }
          emails {
            address
            primary
          }
          tags {
            nodes {
              id
              label
            }
          }
          billingAddress {
            street
            street2
            city
            province
            postalCode
            country
          }
          customFields {
            ... on CustomFieldText {
              id
              label
              valueText
            }
            ... on CustomFieldNumeric {
              id
              label
              valueNumeric
            }
            ... on CustomFieldDropdown {
              id
              label
              valueDropdown
            }
            ... on CustomFieldArea {
              id
              label
              valueArea {
                length
                width
              }
            }
            ... on CustomFieldLink {
              id
              label
              valueLink {
                text
                url
              }
            }
          }
          receivesReminders
          receivesFollowUps
          receivesQuoteFollowUps
          receivesInvoiceFollowUps
          isArchived
          clientProperties(first: 20) {
            nodes {
              id
              name
              address {
                street
                street2
                city
                province
                country
                postalCode
              }
              customFields {
                ... on CustomFieldText {
                  id
                  label
                  valueText
                }
                ... on CustomFieldNumeric {
                  id
                  label
                  valueNumeric
                }
                ... on CustomFieldDropdown {
                  id
                  label
                  valueDropdown
                }
                ... on CustomFieldArea {
                  id
                  label
                  valueArea {
                    length
                    width
                  }
                }
                ... on CustomFieldLink {
                  id
                  label
                  valueLink {
                    text
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.jobberApi.execute<{ data: unknown }>(
        query,
        { id: clientId },
        accessToken,
      );

      if ((response.data as any).errors) {
        this.logger.error('GraphQL errors:', (response.data as any).errors);
        throw new Error('Failed to fetch client details');
      }

      return response.data as any;
    } catch (error) {
      this.logger.error('Error fetching client details:', error);
      throw error;
    }
  }
}
