import { SignUp } from "@clerk/nextjs"

import { getAuthPathnames } from "@/lib/auth-paths"

type SignUpPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function SignUpPage({
  params,
}: Readonly<SignUpPageProps>) {
  const { locale } = await params
  const authPathnames = getAuthPathnames(locale)

  return (
    <SignUp
      fallbackRedirectUrl={authPathnames.patients}
      path={authPathnames.signUp}
      routing="path"
      signInFallbackRedirectUrl={authPathnames.patients}
      signInUrl={authPathnames.signIn}
    />
  )
}
