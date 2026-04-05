import { NextResponse } from "next/server";
import { getAuthToken, clearCookieAuth } from "@/lib/server/http";
import { destroySession } from "@/lib/server/auth";

export async function POST() {
  const token = getAuthToken();
  await destroySession(token);
  const res = NextResponse.json({ success: true, message: "OK" });
  res.headers.set("Set-Cookie", clearCookieAuth());
  return res;
}
