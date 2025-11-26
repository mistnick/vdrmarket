/**
 * OAuth2 Callback Endpoint
 * Currently disabled - OAuth not configured
 * This endpoint would handle OAuth callbacks when OAuth is re-implemented
 */

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // OAuth not currently implemented
  // Redirect to login page
  return NextResponse.redirect(
    new URL("/auth/login?error=oauth_disabled", request.url)
  );
}
