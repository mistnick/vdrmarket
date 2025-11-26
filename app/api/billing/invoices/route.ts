import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * GET /api/billing/invoices
 * Get invoice history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Implement Stripe invoice fetching
    // const invoices = await stripe.invoices.list({
    //   customer: customerId,
    //   limit: 12,
    // });

    // Return mock data for now
    const mockInvoices = [
      {
        id: "in_1",
        number: "INV-2024-001",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 4900,
        currency: "usd",
        status: "paid",
        pdfUrl: "#",
      },
      {
        id: "in_2",
        number: "INV-2024-002",
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 4900,
        currency: "usd",
        status: "paid",
        pdfUrl: "#",
      },
      {
        id: "in_3",
        number: "INV-2023-012",
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 4900,
        currency: "usd",
        status: "paid",
        pdfUrl: "#",
      },
    ];

    return NextResponse.json(mockInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
