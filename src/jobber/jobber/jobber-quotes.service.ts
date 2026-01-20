import { Injectable, Logger } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberQuotesService {
  private readonly logger = new Logger(JobberQuotesService.name);

  constructor(private jobberApi: JobberApiService) {}

  async getQuoteDetails(quoteId: string, accessToken?: string) {
    const query = `
      query GetQuoteById($id: EncodedId!) {
        quote(id: $id) {
          id
          quoteNumber
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
          title
          salesperson {
            name {
              first
              last
            }
          }
          sentAt
          clientHubViewedAt
          quoteStatus
          createdAt
          updatedAt
          amounts {
            subtotal
            total
            discountAmount
            depositAmount
            nonTaxAmount
          }
          client {
            id
            firstName
            lastName
            companyName
            tags {
              nodes {
                id
                label
              }
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

    try {
      const response = await this.jobberApi.execute<{ data: unknown }>(
        query,
        { id: quoteId },
        accessToken,
      );

      if ((response.data as any).errors) {
        this.logger.error('GraphQL errors:', (response.data as any).errors);
        throw new Error('Failed to fetch quote details');
      }

      return response.data as any;
    } catch (error) {
      this.logger.error('Error fetching quote details:', error);
      throw error;
    }
  }

  async getAllQuotes(first: number = 100, after?: string, accessToken?: string) {
    const query = `
      query GetAllQuotes($first: Int!, $after: String) {
        quotes(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            quoteNumber
            title
            quoteStatus
            createdAt
            updatedAt
            amounts {
              subtotal
              total
            }
            client {
              id
              name
              firstName
              lastName
              companyName
            }
            property {
              id
              name
              address {
                street
                city
                province
                postalCode
              }
            }
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
        
        const throttledError = errors.find((e: any) => e.extensions?.code === 'THROTTLED');
        if (throttledError) {
          this.logger.warn('⚠️ Jobber API rate limit exceeded');
          const error: any = new Error('Jobber API rate limit exceeded. Please wait a moment and try again.');
          error.status = 429;
          error.code = 'RATE_LIMIT_EXCEEDED';
          throw error;
        }
        
        const errorMessages = errors.map((e: any) => e.message).join(', ');
        const error: any = new Error(`Jobber API error: ${errorMessages}`);
        error.status = 502;
        error.code = 'JOBBER_API_ERROR';
        throw error;
      }

      return response.data as any;
    } catch (error: any) {
      this.logger.error('Error fetching quotes:', error);
      
      if (error.status) {
        throw error;
      }
      
      const httpError: any = new Error(error.message || 'Failed to fetch quotes from Jobber API');
      httpError.status = 502;
      httpError.code = 'JOBBER_API_ERROR';
      throw httpError;
    }
  }
}
