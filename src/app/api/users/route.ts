import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {serverError} from "@/utils/responses";
import bcrypt from "bcrypt";
import {verifySession} from "@/lib/session";
import {randomBytes} from "crypto";

const TEMPORARY_PASSWORD_BYTES = 12;

function generateTemporaryPassword() {
  return randomBytes(TEMPORARY_PASSWORD_BYTES).toString("hex");
}

export async function GET() {
  const payload = await verifySession();
  if (!payload?.isAdmin) {
    return new NextResponse(null, { status: 403 });
  }
  try {
    const users = await prisma.authUser.findMany({
      include: { worker: true },
      omit: { passwordHash: true }
    });

    return NextResponse.json(users);
  } catch {
    return serverError('user', 'fetch', null)
  }
}

export async function POST(
  req: NextRequest,
) {
  const payload = await verifySession();
  if (!payload?.isAdmin) {
    return new NextResponse(null, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      profilePhotoUrl,
      roleId,
      password,
      temporaryDurationDays,
      expiresAt,
    } = body;

    const parsedTemporaryDurationDays =
      typeof temporaryDurationDays === "string"
        ? Number.parseInt(temporaryDurationDays, 10)
        : temporaryDurationDays;

    const isTemporary = Number.isInteger(parsedTemporaryDurationDays) && parsedTemporaryDurationDays > 0;
    const finalPassword = password || (isTemporary ? generateTemporaryPassword() : null);

    if (!finalPassword) {
      return NextResponse.json(
        { error: "Password or temporaryDurationDays is required" },
        { status: 400 }
      );
    }

    const temporaryExpiresAt = isTemporary
      ? new Date(Date.now() + parsedTemporaryDurationDays * 24 * 60 * 60 * 1000)
      : null;
    const explicitExpiresAt = expiresAt ? new Date(expiresAt) : null;
    const finalExpiresAt = temporaryExpiresAt ?? explicitExpiresAt;

    if (finalExpiresAt && Number.isNaN(finalExpiresAt.getTime())) {
      return NextResponse.json(
        { error: "expiresAt is invalid" },
        { status: 400 }
      );
    }

    const user = await prisma.authUser.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(finalPassword, 10),
        worker: {
          create: {
            fullName,
            roleId,
            phone,
            profilePhotoUrl,
            expiresAt: finalExpiresAt,
          }
        }
      },
      include: { worker: true },
      omit: { passwordHash: true }
    });

    return NextResponse.json({
      ...user,
      temporaryPassword: isTemporary ? finalPassword : null,
      expiresAt: finalExpiresAt,
    }, {status: 201});
  } catch {
    return serverError('user', 'create', null)
  }
}
