import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  formatErrorResponse,
  UnauthorizedError,
} from "@/lib/errors";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "@/lib/auth";
import { staffLoginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = staffLoginSchema.parse(body);

    const user = await prisma.staffUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await createSessionToken(sessionPayload);

    const response = NextResponse.json({
      token,
      user: sessionPayload,
    });

    // Set secure HttpOnly cookie
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return formatErrorResponse(error);
  }
}
