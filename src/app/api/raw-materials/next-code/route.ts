import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { serverError } from "@/utils/responses";

const PREFIX = "MP";
const PAD = 3;
const CONVENTION = `Prefijo "${PREFIX}" (materia prima) seguido de un consecutivo de ${PAD} digitos: ${PREFIX}001, ${PREFIX}002, ...`;

export async function GET() {
  try {
    const materials = await prisma.rawMaterial.findMany({
      select: { code: true },
    });

    const pattern = new RegExp(`^${PREFIX}(\\d+)$`);
    let maxSequence = 0;
    for (const { code } of materials) {
      const match = code.match(pattern);
      if (match) {
        const value = parseInt(match[1], 10);
        if (value > maxSequence) {
          maxSequence = value;
        }
      }
    }

    const nextSequence = maxSequence + 1;
    const code = `${PREFIX}${String(nextSequence).padStart(PAD, "0")}`;

    return NextResponse.json({ code, nextSequence, convention: CONVENTION });
  } catch (error) {
    return serverError("raw material code", "generate", error);
  }
}
