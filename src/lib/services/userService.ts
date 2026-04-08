import { createApolloClient } from "@/lib/apolloClient";
import { GET_USERS } from "@/lib/graphql/queries";

type UserItem = {
  id: string;
  name: string;
  email: string;
};

type GetUsersResponse = {
  users: UserItem[];
};

export async function getUsers(token?: string) {
  const client = createApolloClient(token);

  const { data } = await client.query<GetUsersResponse>({
    query: GET_USERS,
    fetchPolicy: "network-only",
  });

  return data.users;
}
