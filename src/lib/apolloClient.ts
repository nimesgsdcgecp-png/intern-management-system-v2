import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";

const HASURA_URL =
  process.env.HASURA_GRAPHQL_ENDPOINT ||
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT ||
  "http://localhost:8081/v1/graphql";

const HASURA_ADMIN_SECRET =
  process.env.HASURA_GRAPHQL_ADMIN_SECRET || "hasura";

export function createApolloClient(token?: string): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    link: new HttpLink({
      uri: HASURA_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      fetch,
    }),
    cache: new InMemoryCache(),
  });
}

// Used for server-side operations (e.g. login) where no user session exists yet
export function createAdminApolloClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    link: new HttpLink({
      uri: HASURA_URL,
      headers: {
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      fetch,
    }),
    cache: new InMemoryCache(),
  });
}
