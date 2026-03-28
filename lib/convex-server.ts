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
  const mutationName = (mutation as unknown as { _name?: string })._name ?? "unknown"
  console.log(`[CONVEX-SERVER] 🚀 Dispatching mutation: ${mutationName}`)
  console.log(`[CONVEX-SERVER] 📦 Args:`, JSON.stringify(args))

  const adminToken = requireEnvValue(
    process.env.CONVEX_DEPLOYMENT_ADMIN_KEY,
    "CONVEX_DEPLOYMENT_ADMIN_KEY"
  )
  const url = requireEnvValue(
    process.env.NEXT_PUBLIC_CONVEX_URL,
    "NEXT_PUBLIC_CONVEX_URL"
  )

  console.log(`[CONVEX-SERVER] 🔗 Target URL: ${url}`)
  console.log(`[CONVEX-SERVER] 🔑 Admin token present: ${adminToken ? "YES" : "NO"}`)

  const callableMutation = mutation as unknown as FunctionReference<
    "mutation",
    "public",
    FunctionArgs<Mutation>,
    FunctionReturnType<Mutation>
  >

  try {
    const result = await fetchMutation(
      callableMutation as never,
      args as never,
      {
        adminToken,
        url,
      } as never
    )
    console.log(`[CONVEX-SERVER] ✅ Mutation "${mutationName}" completed successfully`)
    console.log(`[CONVEX-SERVER] 📤 Result:`, JSON.stringify(result))
    return result as FunctionReturnType<Mutation>
  } catch (error) {
    console.error(`[CONVEX-SERVER] ❌ Mutation "${mutationName}" FAILED!`)
    console.error(`[CONVEX-SERVER] ❌ Error:`, error)
    throw error
  }
}
