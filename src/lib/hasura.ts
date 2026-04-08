import { print, DocumentNode } from 'graphql';

/**
 * Interface representing the structure of a Hasura GraphQL response.
 * @template T - The expected type of the data returned by the query.
 */
interface HasuraResponse<T> {
  data?: T;
  errors?: {
    message: string;
    extensions?: Record<string, unknown>;
  }[];
}

/**
 * The core utility for making requests to the Hasura GraphQL API.
 * This function handles authentication headers, error reporting, and 
 * data formatting for both server-side and client-side calls.
 * 
 * @template T - The expected data structure returned by the GraphQL operation.
 * @param query - The GraphQL query or mutation, either as a string or a DocumentNode.
 * @param variables - An optional object containing variables to be passed to the GraphQL operation.
 * @param token - An optional JWT token for Bearer authentication.
 * @returns A Promise that resolves to the data returned by the operation.
 */
export async function hasuraCall<T = unknown>(
  query: string | DocumentNode,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const endpoint = process.env.HASURA_PROJECT_ENDPOINT || 
                   process.env.HASURA_GRAPHQL_ENDPOINT ||
                   `http://localhost:${process.env.HASURA_PORT || '8081'}/v1/graphql`;
  
  const adminSecret = process.env.HASURA_ADMIN_SECRET || process.env.HASURA_GRAPHQL_ADMIN_SECRET;

  if (!endpoint) {
    throw new Error('Hasura endpoint not configured.');
  }

  const queryString = typeof query === 'string' ? query : print(query);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (adminSecret) {
    headers['x-hasura-admin-secret'] = adminSecret;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: queryString,
        variables,
      }),
    });

    if (!response.ok) {
      console.error(`[Hasura HTTP Error]: ${response.status} ${response.statusText} at ${endpoint}`);
      throw new Error(`Hasura connection failed with status ${response.status}`);
    }

    const result: HasuraResponse<T> = await response.json();

    if (result.errors) {
      console.error('[Hasura GraphQL Error]:', JSON.stringify(result.errors, null, 2));
      throw new Error(result.errors[0]?.message || 'GraphQL operation failed');
    }

    return result.data as T;
  } catch (error) {
    console.error(`[Hasura Request Failed]: ${endpoint}`);
    throw error;
  }
}

/**
 * A convenience wrapper for executing GraphQL queries.
 */
export const hasuraQuery = hasuraCall;

/**
 * A convenience wrapper for executing GraphQL mutations.
 */
export const hasuraMutation = hasuraCall;

