import { SignUp } from "@clerk/nextjs"

type SignUpPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function SignUpPage({
  params,
}: Readonly<SignUpPageProps>) {
  const { locale } = await params

  return <SignUp fallbackRedirectUrl={`/${locale}/patients`} />
}
