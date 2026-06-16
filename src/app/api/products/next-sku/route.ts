import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { idError, notFoundError, serverError } from "@/utils/responses";

export const dynamic = "force-dynamic";

const PAD = 3;

// Builds a 3-letter prefix from the category name (letters only, uppercased).
const prefixFromName = (name: string): string => {
  const letters = name.normalize("NFD").replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "PRD").padEnd(3, "X");
};

export async function GET(request: NextRequest) {
  const categoryIdRaw = request.nextUrl.searchParams.get("category_id");
  const categoryId = parseInt(categoryIdRaw ?? "", 10);
  if (Number.isNaN(categoryId)) {
    return idError("product category");
  }

  try {
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });
    if (!category) {
      return notFoundError("product category");
    }

    const prefix = prefixFromName(category.name);

    const products = await prisma.product.findMany({
      where: { categoryId },
      select: { sku: true },
    });

    const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");
    let maxSequence = 0;
    for (const { sku } of products) {
      const match = sku.match(pattern);
      if (match) {
        const value = parseInt(match[1], 10);
        if (value > maxSequence) {
          maxSequence = value;
        }
      }
    }

    const nextSequence = maxSequence + 1;
    const sku = `${prefix}${String(nextSequence).padStart(PAD, "0")}`;
    const convention = `3 letras de la categoria ("${prefix}") seguidas de un consecutivo de ${PAD} digitos: ${prefix}001, ${prefix}002, ...`;

    return NextResponse.json(
      { sku, nextSequence, convention },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return serverError("product sku", "generate", error);
  }
}
