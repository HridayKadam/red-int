import { cookies } from "next/headers";
import { AppProvider } from "@/components/providers/app-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { COOKIE_BRAND, COOKIE_MODE, parseMode } from "@/lib/cookies";
import { listBrandSummaries } from "@/lib/repo/brands";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const brands = await listBrandSummaries().catch(() => []);
  const requested = jar.get(COOKIE_BRAND)?.value ?? null;
  const brandId =
    brands.find((item) => item.id === requested)?.id ?? brands[0]?.id ?? null;
  const mode = parseMode(jar.get(COOKIE_MODE)?.value);

  return (
    <AppProvider initialBrands={brands} initialBrandId={brandId} initialMode={mode}>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 bg-white px-6 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </AppProvider>
  );
}
