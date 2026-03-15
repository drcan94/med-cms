import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type WardMapStateCardProps = {
  description: string
  title: string
}

export function WardMapStateCard({
  description,
  title,
}: Readonly<WardMapStateCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
