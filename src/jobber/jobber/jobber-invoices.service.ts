import { Injectable, Logger } from '@nestjs/common';
import { JobberApiService } from './jobber-api.service';

@Injectable()
export class JobberInvoicesService {
  private readonly logger = new Logger(JobberInvoicesService.name);

  constructor(private jobberApi: JobberApiService) {}

  async getInvoiceDetails(invoiceId: string, accessToken?: string) {
    const query = `
      query GetInvoiceDetails($id: EncodedId!) {
        invoice(id: $id) {
          id
          subject
          taxRate { name }
          issuedDate
          dueDate
          invoiceNumber
          invoiceStatus
          createdAt
          updatedAt
          paymentRecords(first: 100) {
            nodes {
              amount
              adjustmentType
              entryDate
              tipAmount
            }
            totalCount
          }
          jobs(first: 100) {
            nodes { jobNumber }
            totalCount
          }
          amounts {
            subtotal
            total
          }
          salesperson {
            name { first last }
          }
          client {
            firstName
            lastName
            companyName
            emails { address primary }
            billingAddress {
              street
              street2
              city
              province
              postalCode
              country
            }
            properties {
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
            phones { number primary }
            customFields {
              ... on CustomFieldText { id label valueText }
              ... on CustomFieldNumeric { id label valueNumeric }
              ... on CustomFieldDropdown { id label valueDropdown }
              ... on CustomFieldArea { id label valueArea { length width } }
              ... on CustomFieldLink { id label valueLink { text url } }
            }
          }
          customFields {
            ... on CustomFieldText { id label valueText }
            ... on CustomFieldNumeric { id label valueNumeric }
            ... on CustomFieldDropdown { id label valueDropdown }
            ... on CustomFieldArea { id label valueArea { length width } }
            ... on CustomFieldLink { id label valueLink { text url } }
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

    const response = await this.jobberApi.execute<{ data: { invoice: unknown } }>(
      query,
      { id: invoiceId },
      accessToken,
    );
    return response.data;
  }
}
