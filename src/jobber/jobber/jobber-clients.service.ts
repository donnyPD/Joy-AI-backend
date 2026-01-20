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

  async getAllClients(first: number = 100, after?: string, accessToken?: string) {
    const query = `
      query GetAllClients($first: Int!, $after: String) {
        clients(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            createdAt
            name
            firstName
            lastName
            companyName
            emails {
              address
              primary
            }
            phones {
              number
              primary
              description
            }
            billingAddress {
              street
              city
              province
              postalCode
              country
            }
            tags {
              nodes {
                id
                label
              }
            }
            isArchived
          }
        }
      }
    `;

    try {
      const response = await this.jobberApi.execute<{ data: unknown }>(
        query,
        { first, after },
        accessToken,
      );

      if ((response.data as any).errors) {
        const errors = (response.data as any).errors;
        this.logger.error('GraphQL errors:', errors);
        
        // Check for specific error types
        const throttledError = errors.find((e: any) => e.extensions?.code === 'THROTTLED');
        if (throttledError) {
          this.logger.warn('⚠️ Jobber API rate limit exceeded');
          const error: any = new Error('Jobber API rate limit exceeded. Please wait a moment and try again.');
          error.status = 429; // Too Many Requests
          error.code = 'RATE_LIMIT_EXCEEDED';
          throw error;
        }
        
        // Check for other common errors
        const errorMessages = errors.map((e: any) => e.message).join(', ');
        const error: any = new Error(`Jobber API error: ${errorMessages}`);
        error.status = 502; // Bad Gateway
        error.code = 'JOBBER_API_ERROR';
        throw error;
      }

      return response.data as any;
    } catch (error: any) {
      this.logger.error('Error fetching clients:', error);
      
      // If error already has status, rethrow it
      if (error.status) {
        throw error;
      }
      
      // For network errors or other issues
      const httpError: any = new Error(error.message || 'Failed to fetch clients from Jobber API');
      httpError.status = 502;
      httpError.code = 'JOBBER_API_ERROR';
      throw httpError;
    }
  }
}
