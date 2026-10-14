import { NextRequest, NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";
import { ExportQuerySchema } from "@/lib/schemas";
import { formatLeadsToStandardCsv, formatLeadsToHubspotCsv } from "@/lib/export";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const parsed = ExportQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid export parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { format, search, minScore, categories, hideDuplicates } = parsed.data;

    // Fetch all matching leads without pagination limits for full export
    const { leads } = await leadRepository.getLeads({
      criteria: {
        search,
        minScore,
        categories,
        hideDuplicates,
      },
      pageSize: 5000,
    });

    let csvContent = "";
    let filename = "";

    if (format === "hubspot") {
      csvContent = formatLeadsToHubspotCsv(leads);
      filename = `leadlens-hubspot-export-${Date.now()}.csv`;
    } else {
      csvContent = formatLeadsToStandardCsv(leads);
      filename = `leadlens-leads-export-${Date.now()}.csv`;
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to export leads", message: error.message },
      { status: 500 }
    );
  }
}
