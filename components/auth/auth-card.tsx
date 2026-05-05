import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function AuthCard({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border border-border bg-card/95 backdrop-blur">
      <CardHeader className="gap-1.5">
        <CardTitle className="font-heading text-2xl leading-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
