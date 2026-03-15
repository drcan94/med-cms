import { SignUp } from "@clerk/nextjs"

import { getAuthPathnames } from "@/lib/auth-paths"

export default function SignUpPage() {
  const authPathnames = getAuthPathnames()

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
