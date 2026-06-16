import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { serverError } from "@/utils/responses";
import bcrypt from "bcrypt";
import { verifySession } from "@/lib/session";
import { randomBytes } from "crypto";

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
    return serverError('user', 'fetch', null);
  }
}

export async function POST(req: NextRequest) {
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
    } = body;

    const isTemporary = Number.isInteger(temporaryDurationDays) && temporaryDurationDays > 0;
    const finalPassword = password || (isTemporary ? generateTemporaryPassword() : null);

    if (!finalPassword) {
      return NextResponse.json(
        { error: "Password or temporaryDurationDays is required" },
        { status: 400 }
      );
    }

    const finalExpiresAt = isTemporary
      ? new Date(Date.now() + temporaryDurationDays * 24 * 60 * 60 * 1000)
      : null;

    const user = await prisma.authUser.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(finalPassword, 10),
        worker: {
          create: {
            fullName,
            roleId: roleId ? Number.parseInt(roleId, 10) : null,
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
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError('user', 'create', null);
  }
}