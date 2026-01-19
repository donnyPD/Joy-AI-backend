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
          }
          property {
            id
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
}
