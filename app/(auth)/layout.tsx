export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="flex flex-1 items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">{children}</div>
    </section>
  );
}
