import { SignIn } from "@clerk/nextjs"

import { getAuthPathnames } from "@/lib/auth-paths"

type SignInPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function SignInPage({
  params,
}: Readonly<SignInPageProps>) {
  const { locale } = await params
  const authPathnames = getAuthPathnames(locale)

  return (
    <SignIn
      fallbackRedirectUrl={authPathnames.patients}
      path={authPathnames.signIn}
      routing="path"
      signUpFallbackRedirectUrl={authPathnames.patients}
      signUpUrl={authPathnames.signUp}
    />
  )
}
