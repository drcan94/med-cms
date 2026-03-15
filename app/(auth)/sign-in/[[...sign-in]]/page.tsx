import { SignIn } from "@clerk/nextjs"

import { getAuthPathnames } from "@/lib/auth-paths"

export default function SignInPage() {
  const authPathnames = getAuthPathnames()

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
