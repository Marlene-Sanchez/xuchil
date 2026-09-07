"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const LegacyStepRedirect = () => {
  const { productId, variantId } = useParams<{
    productId: string;
    variantId: string;
  }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/process-control/new-production/${productId}/${variantId}`
    );
  }, [productId, variantId, router]);

  return (
    <div className="page">
      <h1>Abriendo el proceso...</h1>
    </div>
  );
};

export default LegacyStepRedirect;
