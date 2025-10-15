import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SUBSCRIPTION_TIERS, CREDITS_TIERS } from "@/config/subscriptions";
import { createCheckoutSession } from "@/app/actions";

type ProductType = "subscription" | "credits";

type RequestBody = {
  productId?: string;
  tierId?: string; // id from config tiers
  productType?: string; // e.g. "subscription" | "credits" | "chinese-name-credits"
  credits_amount?: number; // optional override
  quantity?: number; // deprecated; kept for compatibility
  discountCode?: string;
};

function resolveFromTierId(tierId: string | undefined):
  | { productId: string; type: ProductType; credits_amount?: number }
  | null {
  if (!tierId) return null;
  const sub = SUBSCRIPTION_TIERS.find((t) => t.id === tierId);
  if (sub) return { productId: sub.productId, type: "subscription" };
  const credit = CREDITS_TIERS.find((t) => t.id === tierId);
  if (credit)
    return {
      productId: credit.productId,
      type: "credits",
      credits_amount: credit.creditAmount,
    };
  return null;
}

function resolveFromProductId(productId: string | undefined):
  | { productId: string; type: ProductType; credits_amount?: number }
  | null {
  if (!productId) return null;
  const sub = SUBSCRIPTION_TIERS.find((t) => t.productId === productId);
  if (sub) return { productId: sub.productId, type: "subscription" };
  const credit = CREDITS_TIERS.find((t) => t.productId === productId);
  if (credit)
    return {
      productId: credit.productId,
      type: "credits",
      credits_amount: credit.creditAmount,
    };
  // Unknown productId; default to credits without credit amount
  return { productId, type: "credits" };
}

function pickDefaultCreditsTier(): { productId: string; credits_amount?: number } {
  // Prefer featured credits tier, otherwise first one
  const featured = CREDITS_TIERS.find((t) => t.featured);
  const chosen = featured || CREDITS_TIERS[0];
  return { productId: chosen.productId, credits_amount: chosen.creditAmount };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as RequestBody;

    // Resolve product selection and type
    let resolved =
      resolveFromProductId(body.productId) ||
      resolveFromTierId(body.tierId) ||
      null;

    let type: ProductType = "credits";
    let productId: string;
    let credits_amount: number | undefined = body.credits_amount;

    if (!resolved) {
      // Fallback based on productType hint
      const hint = (body.productType || "").toLowerCase();
      if (hint === "subscription") {
        const sub = SUBSCRIPTION_TIERS[0];
        resolved = { productId: sub.productId, type: "subscription" };
      } else {
        // Treat unknown strings like "chinese-name-credits" as credits
        const picked = pickDefaultCreditsTier();
        resolved = { productId: picked.productId, type: "credits", credits_amount: picked.credits_amount } as any;
      }
    }

    productId = resolved!.productId;
    type = resolved!.type;
    if (resolved!.credits_amount && credits_amount == null) {
      credits_amount = resolved!.credits_amount;
    }

    // Ensure required environment variables exist
    if (!process.env.CREEM_API_URL || !process.env.CREEM_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Missing CREEM_API_URL or CREEM_API_KEY. Please set them in your environment.",
        },
        { status: 500 }
      );
    }

    // Use user's email from session
    const email = user.email || "";
    if (!email) {
      return NextResponse.json(
        { error: "User email not available. Please ensure the user has a valid email." },
        { status: 400 }
      );
    }

    // Map non-standard productType values to supported ones
    let normalizedType: ProductType = type;
    if (body.productType && body.productType.toLowerCase().includes("credit")) {
      normalizedType = "credits";
    }

    const checkoutUrl = await createCheckoutSession(
      productId,
      email,
      user.id,
      normalizedType,
      credits_amount,
      body.discountCode
    );

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("Error in create-checkout route:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create checkout session", details: message },
      { status: 500 }
    );
  }
}
