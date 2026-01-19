import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class JobberApiService {
  private readonly graphqlVersion: string;

  constructor(private configService: ConfigService) {
    this.graphqlVersion = this.configService.get<string>('JOBBER_GRAPHQL_VERSION', '2025-04-16');
  }

  async execute<T>(
    query: string,
    variables?: Record<string, unknown>,
    accessToken?: string,
  ) {
    if (!accessToken) {
      throw new Error('No Jobber access token provided (DB token required; env fallback disabled)');
    }

    return axios.post<T>(
      'https://api.getjobber.com/api/graphql',
      {
        query,
        variables,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-JOBBER-GRAPHQL-VERSION': this.graphqlVersion,
        },
      },
    );
  }
}
