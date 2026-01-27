import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobberInvoicesService } from '../../jobber/jobber/jobber-invoices.service';
import { AuthService } from '../../auth/auth.service';
import { JobberOAuthService } from '../../auth/jobber/jobber-oauth.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private jobberInvoicesService: JobberInvoicesService,
    private authService: AuthService,
    private jobberOAuthService: JobberOAuthService,
  ) {}

  private async getAccessTokenForWebhook(webhookPayload: any): Promise<string | undefined> {
    const accountId =
      webhookPayload.data?.webHookEvent?.accountId ||
      webhookPayload.accountId ||
      webhookPayload.data?.accountId;

    if (!accountId) {
      this.logger.warn('Webhook payload missing accountId; cannot resolve user-specific token.');
      return undefined;
    }

    const user = await this.authService.getUserByAccountIdOrAttach(accountId);
    if (!user?.id) {
      throw new Error(
        `No connected user found for Jobber accountId ${accountId}. Please disconnect/reconnect Jobber.`,
      );
    }

    return await this.jobberOAuthService.getValidAccessToken(user.id);
  }

  async handleInvoiceCreate(webhookPayload: any) {
    try {
      const invoiceId = webhookPayload.data?.webHookEvent?.itemId;
      if (!invoiceId) {
        throw new Error('Invoice ID not found in webhook payload');
      }

      this.logger.log(`Processing INVOICE_CREATE for: ${invoiceId}`);

      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberInvoicesService.getInvoiceDetails(invoiceId, accessToken);
      console.log('Jobber invoice full response:', JSON.stringify(jobberData, null, 2));
      const jobberInvoice = jobberData.data?.invoice;

      if (!jobberInvoice) {
        throw new Error('Invoice not found in Jobber');
      }

      const invoiceData = this.transformJobberData(jobberInvoice);

      const invoice = await (this.prisma as any).invoice.upsert({
        where: { jId: invoiceData.jId },
        update: invoiceData,
        create: invoiceData,
      });

      this.logger.log(`✅ Invoice saved: ${invoice.jId}`);
      return invoice;
    } catch (error) {
      this.logger.error('Error handling invoice create:', error);
      throw error;
    }
  }

  async handleInvoiceUpdate(webhookPayload: any) {
    try {
      const invoiceId = webhookPayload.data?.webHookEvent?.itemId;
      if (!invoiceId) {
        throw new Error('Invoice ID not found in webhook payload');
      }

      this.logger.log(`Processing INVOICE_UPDATE for: ${invoiceId}`);

      const accessToken = await this.getAccessTokenForWebhook(webhookPayload);
      const jobberData = await this.jobberInvoicesService.getInvoiceDetails(invoiceId, accessToken);
      const jobberInvoice = jobberData.data?.invoice;

      if (!jobberInvoice) {
        throw new Error('Invoice not found in Jobber');
      }

      const invoiceData = this.transformJobberData(jobberInvoice);

      const invoice = await (this.prisma as any).invoice.upsert({
        where: { jId: invoiceData.jId },
        update: invoiceData,
        create: invoiceData,
      });

      this.logger.log(`✅ Invoice updated: ${invoice.jId}`);
      return invoice;
    } catch (error) {
      this.logger.error('Error handling invoice update:', error);
      throw error;
    }
  }

  async handleInvoiceDestroy(webhookPayload: any) {
    try {
      const invoiceId = webhookPayload.data?.webHookEvent?.itemId;
      if (!invoiceId) {
        throw new Error('Invoice ID not found in webhook payload');
      }

      this.logger.log(`Processing INVOICE_DESTROY for: ${invoiceId}`);

      await (this.prisma as any).invoice.deleteMany({
        where: { jId: invoiceId },
      });

      this.logger.log(`✅ Invoice deleted: ${invoiceId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error handling invoice destroy:', error);
      throw error;
    }
  }

  async findAll(limit: number = 100, skip: number = 0) {
    try {
      const invoices = await (this.prisma as any).invoice.findMany({
        take: limit,
        skip: skip,
        orderBy: { dbCreatedAt: 'desc' },
      });
      return invoices;
    } catch (error) {
      this.logger.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const invoice = await (this.prisma as any).invoice.findUnique({
        where: { id },
      });
      return invoice;
    } catch (error) {
      this.logger.error('Error fetching invoice:', error);
      throw error;
    }
  }

  async count() {
    try {
      return await (this.prisma as any).invoice.count();
    } catch (error) {
      this.logger.error('Error counting invoices:', error);
      throw error;
    }
  }

  private transformJobberData(jobberInvoice: any) {
    // Helper function to get custom field by label (case-insensitive)
    const getCustomFieldByLabel = (fields: any[], label: string): string | null => {
      if (!fields || !Array.isArray(fields)) return null;
      const field = fields.find(
        (f: any) => f?.label?.toLowerCase() === label.toLowerCase(),
      );
      if (!field) return null;
      return field?.valueText || field?.valueDropdown || field?.valueNumeric || field?.valueArea || field?.valueLink?.text || null;
    };

    // Format date to yyyy-MM-dd
    const formatDate = (date: string | null | undefined): string | null => {
      if (!date) return null;
      try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return null;
      }
    };

    // Client info
    const client = jobberInvoice.client || {};
    const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || '';
    const clientEmail = client.emails?.[0]?.address || '';
    const clientPhone = client.phones?.[0]?.number || '';
    const sentTo = client.emails?.map((email: any) => email?.address).filter(Boolean).join(', ') || '';
    const clientBilling = client.billingAddress || {};

    // Property info (from first property)
    const property = client.properties?.[0] || {};
    const propertyAddress = property.address || {};

    // Salesperson
    const salespersonName = jobberInvoice.salesperson?.name
      ? [jobberInvoice.salesperson.name.first, jobberInvoice.salesperson.name.last].filter(Boolean).join(' ')
      : '';

    // Line items formatting
    const lineItems = jobberInvoice.lineItems?.nodes || [];
    const nonZeroLineItems = lineItems.filter(
      (item: any) => (item?.unitPrice ?? 0) !== 0 || (item?.totalPrice ?? 0) !== 0,
    );
    const lineItemsFormatted = nonZeroLineItems
      .map((item: any) => `${item?.name || 'Unnamed'} – qty: ${item?.qty ?? 0} – unit_Cost: ${item?.unitPrice ?? 0} – total_Cost: ${item?.totalPrice ?? 0}`)
      .join(', ');

    // Job numbers
    const jobs = jobberInvoice.jobs?.nodes || [];
    const jobNumbers = jobs.map((job: any) => job?.jobNumber).filter(Boolean).join(', ') || '';

    // Custom fields
    const customFields = jobberInvoice.customFields || [];
    const clientCustomFields = client.customFields || [];

    // Payment records
    const paymentRecords = jobberInvoice.paymentRecords?.nodes || [];

    // Amounts
    const amounts = jobberInvoice.amounts || {};
    const totalAmount = amounts.total != null ? Number(amounts.total) : null;
    const subtotalAmount = amounts.subtotal != null ? Number(amounts.subtotal) : null;
    const paidTotal = paymentRecords
      .map((record: any) => Number(record?.amount ?? 0))
      .filter((value: number) => !Number.isNaN(value))
      .reduce((sum: number, value: number) => sum + value, 0);
    const balanceAmount = totalAmount != null ? Math.max(totalAmount - paidTotal, 0) : null;
    const tipAmount = paymentRecords
      .map((record: any) => Number(record?.tipAmount ?? 0))
      .filter((value: number) => !Number.isNaN(value))
      .reduce((sum: number, value: number) => sum + value, 0);
    const latestPayment = paymentRecords
      .filter((record: any) => record?.entryDate)
      .sort((a: any, b: any) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())[0];
    const markedPaidDate = latestPayment?.entryDate ? formatDate(latestPayment.entryDate) : null;
    const daysBetween = (start: string | null, end: string | null): string | null => {
      if (!start || !end) return null;
      try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? String(diffDays) : null;
      } catch {
        return null;
      }
    };
    const daysToPaid = markedPaidDate && jobberInvoice.issuedDate
      ? daysBetween(jobberInvoice.issuedDate, markedPaidDate)
      : null;
    const lateBy = markedPaidDate && jobberInvoice.dueDate
      ? daysBetween(jobberInvoice.dueDate, markedPaidDate)
      : null;

    return {
      jId: jobberInvoice.id,
      invoiceNumber: jobberInvoice.invoiceNumber || null,
      clientJId: client.id || null,
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      clientPhone: clientPhone || null,
      servicePropertyName: property.name || null,
      serviceStreet: propertyAddress.street || null,
      serviceCity: propertyAddress.city || null,
      serviceProvince: propertyAddress.province || null,
      serviceZip: propertyAddress.postalCode || null,
      serviceCountry: propertyAddress.country || null,
      billingStreet: clientBilling.street || propertyAddress.street || null,
      billingCity: clientBilling.city || propertyAddress.city || null,
      billingProvince: clientBilling.province || propertyAddress.province || null,
      billingZip: clientBilling.postalCode || propertyAddress.postalCode || null,
      subject: jobberInvoice.subject || null,
      status: jobberInvoice.invoiceStatus || null,
      salesperson: salespersonName || null,
      createdDate: formatDate(jobberInvoice.createdAt),
      issuedDate: formatDate(jobberInvoice.issuedDate),
      dueDate: formatDate(jobberInvoice.dueDate),
      total: totalAmount != null ? String(totalAmount) : null,
      balance: balanceAmount != null ? String(balanceAmount) : null,
      preTaxTotal: subtotalAmount != null ? String(subtotalAmount) : null,
      tip: tipAmount ? String(tipAmount) : null,
      taxPercent: jobberInvoice.taxRate?.name || null,
      taxAmount: null, // Can be calculated if needed
      deposit: null,
      discount: null,
      lineItemsJson: JSON.stringify(lineItems),
      lineItems: lineItemsFormatted || null,
      jobNumbers: jobNumbers || null,
      birthdayMonth: getCustomFieldByLabel(customFields, 'birthday month') || null,
      frequency: getCustomFieldByLabel(customFields, 'frequency') || null,
      typeOfProperty: getCustomFieldByLabel(customFields, 'type of property') || null,
      parkingDetails: getCustomFieldByLabel(customFields, 'parking details') || null,
      squareFoot: getCustomFieldByLabel(customFields, 'square foot') || null,
      exactSqFt: getCustomFieldByLabel(customFields, 'exact sqft') || null,
      preferredTimeOfContact: getCustomFieldByLabel(customFields, 'preferred time of contact') || null,
      zone: getCustomFieldByLabel(customFields, 'zone') || null,
      cleaningTech: getCustomFieldByLabel(customFields, 'cleaning tech') || null,
      referredBy: getCustomFieldByLabel(customFields, 'referred by') || null,
      leadSource:
        getCustomFieldByLabel(customFields, 'Lead Source') ||
        getCustomFieldByLabel(clientCustomFields, 'Lead Source') ||
        null,
      sentTo: sentTo || null,
      lateBy: lateBy,
      markedPaidDate: markedPaidDate,
      daysToPaid: daysToPaid,
      lastContacted: null,
      visitsAssignedTo: getCustomFieldByLabel(customFields, 'Visits assigned to') || null,
      cleaningTechAssigned:
        getCustomFieldByLabel(customFields, 'Cleaning Tech Assigned') ||
        getCustomFieldByLabel(customFields, 'Cleaning Tech') ||
        null,
      viewedInClientHub: null,
      customFieldsJson: JSON.stringify(customFields),
      clientJson: JSON.stringify(client),
      propertyJson: JSON.stringify(property),
      amountsJson: JSON.stringify(amounts),
      paymentRecordsJson: JSON.stringify(paymentRecords),
    };
  }
}
