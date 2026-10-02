import { prisma } from "@/lib/db";
import { loadReport } from "@/lib/data/console";
import { ReportView } from "@/components/report/report-view";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await prisma.reportShare.findUnique({
    where: { token },
    include: { brand: true },
  });
  if (!share) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-[22px] font-bold">redlify</p>
        <h1 className="mt-6 text-3xl font-bold">Report not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This share link is invalid or expired.</p>
      </div>
    );
  }
  const data = await loadReport(share.brandId);
  if (!data.current) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-sm text-muted-foreground">No tracking data for this brand yet.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="mb-8 text-[22px] font-bold tracking-tight">redlify</p>
      <ReportView
        brandId={share.brandId}
        brandName={share.brand.name}
        category={share.brand.category}
        domain={share.brand.domain}
        current={data.current}
        baseline={data.baseline}
        snapshots={data.snapshots}
        leaderboard={data.leaderboard}
        flips={data.recheck.flips}
        lift={data.recheck.lift}
        content={data.content.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          status: item.status,
          publishedUrl: item.publishedUrl,
        }))}
        sharePath={null}
      />
    </div>
  );
}
