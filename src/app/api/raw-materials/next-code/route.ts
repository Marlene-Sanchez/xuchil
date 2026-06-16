import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { serverError } from "@/utils/responses";

export const dynamic = "force-dynamic";

const PREFIX = "MP";
const PAD = 3;
const CONVENTION = `Prefijo "${PREFIX}" (materia prima) seguido de un consecutivo de ${PAD} digitos: ${PREFIX}001, ${PREFIX}002, ...`;

export async function GET() {
  try {
    const materials = await prisma.rawMaterial.findMany({
      select: { code: true },
    });

    // Case-insensitive so codes like "mp009" also count toward the sequence.
    const pattern = new RegExp(`^${PREFIX}(\\d+)$`, "i");
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

    return NextResponse.json(
      { code, nextSequence, convention: CONVENTION },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return serverError("raw material code", "generate", error);
  }
}
