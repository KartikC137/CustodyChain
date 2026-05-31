import { Header } from "@/src/components/layout/home/Header";
import { LedgersProvider } from "@/src/context-and-hooks/LedgersContext";

export default async function HomePagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      <LedgersProvider>{children}</LedgersProvider>
    </div>
  );
}
