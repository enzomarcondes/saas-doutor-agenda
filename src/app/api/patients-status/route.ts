import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getPatientsDueDatesStatus } from "@/actions/get-patients-due-dates-status";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: new Headers(headersList),
    });

    if (!session?.user?.clinic?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientIds } = body;

    if (!patientIds || !Array.isArray(patientIds)) {
      return NextResponse.json(
        { error: "Invalid patientIds" },
        { status: 400 },
      );
    }

    const result = await getPatientsDueDatesStatus({
      patientIds,
    });

    if (result?.serverError) {
      return NextResponse.json({ error: result.serverError }, { status: 500 });
    }

    if (result?.validationErrors) {
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }

    return NextResponse.json(result?.data || []);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
