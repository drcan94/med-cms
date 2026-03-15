import { SignIn } from "@clerk/nextjs"

type SignInPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function SignInPage({
  params,
}: Readonly<SignInPageProps>) {
  const { locale } = await params

  return <SignIn fallbackRedirectUrl={`/${locale}/patients`} />
}
