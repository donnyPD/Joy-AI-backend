import { Injectable, Logger } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberJobsService {
  private readonly logger = new Logger(JobberJobsService.name);

  constructor(private jobberApi: JobberApiService) {}

  async getJobDetails(jobId: string, accessToken?: string) {
    const query = `
      query GetJobDetails($id: EncodedId!) {
        job(id: $id) {
          id
          invoices(first: 100) {
            nodes {
              id
              invoiceNumber
              invoiceStatus
              createdAt
              issuedDate
              dueDate
              taxAmount
              subtotal
              total
              discountAmount
            }
            totalCount
          }
          quote {
            quoteNumber
          }
          jobNumber
          jobType
          title
          jobStatus
          createdAt
          startAt
          endAt
          salesperson {
            name {
              first
              last
            }
          }
          instructions
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
          client {
            id
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
          billingType
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
          visits(first: 100) {
            nodes {
              id
              title
              visitStatus
              startAt
              endAt
            }
            totalCount
          }
        }
      }
    `;

    try {
      const response = await this.jobberApi.execute<{ data: unknown }>(
        query,
        { id: jobId },
        accessToken,
      );

      if ((response.data as any).errors) {
        this.logger.error('GraphQL errors:', (response.data as any).errors);
        throw new Error('Failed to fetch job details');
      }

      return response.data as any;
    } catch (error) {
      this.logger.error('Error fetching job details:', error);
      throw error;
    }
  }

  async getAllJobs(first: number = 100, after?: string, accessToken?: string) {
    const query = `
      query GetAllJobs($first: Int!, $after: String) {
        jobs(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            jobNumber
            title
            jobStatus
            jobType
            createdAt
            startAt
            endAt
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
      this.logger.error('Error fetching jobs:', error);
      
      if (error.status) {
        throw error;
      }
      
      const httpError: any = new Error(error.message || 'Failed to fetch jobs from Jobber API');
      httpError.status = 502;
      httpError.code = 'JOBBER_API_ERROR';
      throw httpError;
    }
  }
}
