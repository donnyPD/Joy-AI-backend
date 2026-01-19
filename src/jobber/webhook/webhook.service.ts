import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly graphqlVersion: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.graphqlVersion = this.configService.get<string>('JOBBER_GRAPHQL_VERSION', '2025-04-16');
    this.baseUrl = this.configService.get<string>('APP_URL') || '';
  }

  async registerAllWebhooks(accessToken: string) {
    const token = accessToken;
    if (!token) {
      throw new Error('No Jobber access token provided for webhook registration');
    }
    if (!this.baseUrl) {
      throw new Error(
        'APP_URL is not configured. Set APP_URL to your public backend base URL (e.g. https://<your-ngrok-domain>) before connecting Jobber.',
      );
    }
    if (
      this.baseUrl.includes('localhost') ||
      this.baseUrl.includes('127.0.0.1') ||
      this.baseUrl.startsWith('http://')
    ) {
      throw new Error(
        `APP_URL must be a public HTTPS URL for Jobber webhooks. Current APP_URL: ${this.baseUrl}`,
      );
    }
    this.logger.log('🔄 Auto-registering Jobber webhooks...');
    this.logger.log(`🌐 Webhook base URL: ${this.baseUrl}`);

    // Create a new client with the provided token
    const client = axios.create({
      baseURL: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': this.graphqlVersion,
      },
    });

    const webhooks = [
      {
        topic: 'CLIENT_CREATE',
        url: `${this.baseUrl}/webhooks/jobber/client/create`,
      },
      {
        topic: 'CLIENT_UPDATE',
        url: `${this.baseUrl}/webhooks/jobber/client/update`,
      },
      {
        topic: 'CLIENT_DESTROY',
        url: `${this.baseUrl}/webhooks/jobber/client/destroy`,
      },
      {
        topic: 'QUOTE_CREATE',
        url: `${this.baseUrl}/webhooks/jobber/quote/create`,
      },
      {
        topic: 'QUOTE_UPDATE',
        url: `${this.baseUrl}/webhooks/jobber/quote/update`,
      },
      {
        topic: 'QUOTE_SENT',
        url: `${this.baseUrl}/webhooks/jobber/quote/sent`,
      },
      {
        topic: 'QUOTE_APPROVED',
        url: `${this.baseUrl}/webhooks/jobber/quote/approved`,
      },
      {
        topic: 'QUOTE_DESTROY',
        url: `${this.baseUrl}/webhooks/jobber/quote/destroy`,
      },
      {
        topic: 'JOB_CREATE',
        url: `${this.baseUrl}/webhooks/jobber/job/create`,
      },
      {
        topic: 'JOB_UPDATE',
        url: `${this.baseUrl}/webhooks/jobber/job/update`,
      },
      {
        topic: 'JOB_DESTROY',
        url: `${this.baseUrl}/webhooks/jobber/job/destroy`,
      },
      {
        topic: 'JOB_CLOSED',
        url: `${this.baseUrl}/webhooks/jobber/job/closed`,
      },
    ];

    for (const webhook of webhooks) {
      try {
        this.logger.log(`Registering webhook: ${webhook.topic} -> ${webhook.url}`);
        await this.registerWebhook(webhook.topic, webhook.url, client);
        this.logger.log(`✅ Registered: ${webhook.topic}`);
      } catch (error) {
        this.logger.error(`❌ Failed to register ${webhook.topic}:`, error.message);
      }
    }
  }

  private async registerWebhook(topic: string, url: string, client: AxiosInstance) {
    const graphqlClient = client;
    const mutation = `
      mutation CreateWebhookEndpoint($input: WebhookEndpointCreateInput!) {
        webhookEndpointCreate(input: $input) {
          webhookEndpoint {
            id
            url
            topic
          }
        }
      }
    `;

    try {
      const response = await graphqlClient.post('', {
        query: mutation,
        variables: {
          input: {
            url,
            topic,
          },
        },
      });

      if (response.data.errors) {
        this.logger.error('GraphQL errors:', response.data.errors);
        throw new Error(`Failed to register webhook: ${response.data.errors[0].message}`);
      }

      return response.data.data.webhookEndpointCreate.webhookEndpoint;
    } catch (error) {
      if (error.response?.data) {
        this.logger.error('Webhook registration error:', error.response.data);
      }
      throw error;
    }
  }
}
