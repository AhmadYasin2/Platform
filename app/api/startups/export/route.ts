
// app/api/startups/export/route.ts — Prisma implementation for your schema
// Returns startups (active) with their selected packages + parent services.

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const prisma = new PrismaClient();
    const data = await prisma.startups.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        notification_email: true,
        email: true,
        startup_services: {
          select: {
            hours_used: true, // <-- needed for summary sheet
            packages: {
              select: {
                name: true,
                hours: true,
                price: true,
                services: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Build a per-service map of rows
    const byService: Record<string, Array<{ Startup: string; Email: string; Package: string; Hours: number; Price: number }>> = {};

    // Prepare summary rows (total hours_used per startup)
    const SUMMARY_CAP = 1500; // per your request
    const summaryRows: Array<{ Startup: string; "Hours Used": number; "Out of": number }> = [];

    for (const s of data) {
      const startupName = s.name;
      const email = s.notification_email ?? s.email ?? "";

      let totalUsed = 0;
      for (const sel of s.startup_services || []) {
        const pkg = sel.packages;
        totalUsed += sel.hours_used ?? 0;
        if (!pkg) continue;
        const serviceName = pkg.services?.name || "Unknown Service";
        if (!byService[serviceName]) byService[serviceName] = [];
        byService[serviceName].push({
          Startup: startupName,
          Email: email,
          Package: pkg.name,
          Hours: pkg.hours ?? 0,
          Price: pkg.price ?? 0,
        });
      }
      summaryRows.push({ Startup: startupName, "Hours Used": totalUsed, "Out of": SUMMARY_CAP });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    if (format === "xlsx") {
      // Server-side XLSX with a sheet per service + Summary sheet
      const _mod: any = await import("xlsx");
      const XLSX: any = _mod?.default ?? _mod;

      const wb = XLSX.utils.book_new();

      // Summary sheet first
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows, { header: ["Startup", "Hours Used", "Out of"] });
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      const sanitize = (name: string) =>
        name
          .replace(/[\\/*?:\[\]]/g, "_")
          .slice(0, 31) || "Sheet";

      const serviceNames = Object.keys(byService).sort((a, b) => a.localeCompare(b));

      if (serviceNames.length === 0) {
        const ws = XLSX.utils.json_to_sheet([]);
        XLSX.utils.sheet_add_aoa(ws, [["No selections found for active startups."]], { origin: "A1" });
        XLSX.utils.book_append_sheet(wb, ws, "(empty)");
      } else {
        for (const svc of serviceNames) {
          const rows = byService[svc];
          const dataRows = rows.map((r) => ({
            Startup: r.Startup,
            Email: r.Email,
            Package: r.Package,
            Hours: r.Hours,
            Price: r.Price,
          }));
          const ws = XLSX.utils.json_to_sheet(dataRows, { header: ["Startup", "Email", "Package", "Hours", "Price"] });
          XLSX.utils.book_append_sheet(wb, ws, sanitize(svc));
        }
      }

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const filename = `startups_by_service_${new Date().toISOString().slice(0, 10)}.xlsx`;
      return new NextResponse(buf as any, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // JSON fallback (grouped by service + summary)
    return NextResponse.json({
      summary: summaryRows,
      byService,
    });
  } catch (e: any) {
    console.error("/api/startups/export error:", e);
    return new NextResponse(e?.message || "Export failed", { status: 500 });
  }
}
