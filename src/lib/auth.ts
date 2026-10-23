import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { StaffRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "wellspring_staff_session";

export interface StaffSession {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

const getSecretKey = () => new TextEncoder().encode(env.AUTH_SECRET);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  plainText: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export async function createSessionToken(session: StaffSession): Promise<string> {
  return new SignJWT({
    sub: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      !payload.sub ||
      !payload.email ||
      !payload.role ||
      (payload.role !== "ADMIN" && payload.role !== "EMPLOYEE")
    ) {
      return null;
    }
    return {
      id: payload.sub,
      name: (payload.name as string) || "",
      email: payload.email as string,
      role: payload.role as StaffRole,
    };
  } catch {
    return null;
  }
}

export async function getStaffSession(
  request: Request
): Promise<StaffSession | null> {
  // 1. Check Authorization: Bearer <token>
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const session = await verifySessionToken(token);
    if (session) return session;
  }

  // 2. Check Cookie header
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`)
    );
    if (match && match[1]) {
      const session = await verifySessionToken(decodeURIComponent(match[1]));
      if (session) return session;
    }
  }

  return null;
}

export async function requireStaffSession(
  request: Request,
  allowedRoles?: StaffRole[]
): Promise<StaffSession> {
  const session = await getStaffSession(request);
  if (!session) {
    throw new UnauthorizedError("Staff authentication required");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      throw new ForbiddenError(
        `Action requires one of the following roles: ${allowedRoles.join(", ")}`
      );
    }
  }

  return session;
}
