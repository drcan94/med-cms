import { fetchMutation } from "convex/nextjs"
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server"

function requireEnvValue(
  value: string | undefined,
  variableName: string
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${variableName} is required for server-side Convex access.`)
  }

  return normalizedValue
}

export async function runConvexServerMutation<
  Mutation extends FunctionReference<"mutation", "internal" | "public">,
>(
  mutation: Mutation,
  args: FunctionArgs<Mutation>
): Promise<FunctionReturnType<Mutation>> {
  const callableMutation = mutation as unknown as FunctionReference<
    "mutation",
    "public",
    FunctionArgs<Mutation>,
    FunctionReturnType<Mutation>
  >

  // Convex's server-side admin token path can execute internal mutations even
  // though `fetchMutation` is typed for public references.
  return fetchMutation(
    callableMutation as never,
    args as never,
    {
      adminToken: requireEnvValue(
        process.env.CONVEX_DEPLOYMENT_ADMIN_KEY,
        "CONVEX_DEPLOYMENT_ADMIN_KEY"
      ),
      url: requireEnvValue(
        process.env.NEXT_PUBLIC_CONVEX_URL,
        "NEXT_PUBLIC_CONVEX_URL"
      ),
    } as never
  ) as Promise<FunctionReturnType<Mutation>>
}
