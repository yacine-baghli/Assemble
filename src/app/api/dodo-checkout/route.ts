import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function getEnv(key: string): Promise<string> {
  // Try Cloudflare Workers bindings first, then process.env
  try {
    const { env } = await getCloudflareContext();
    const val = (env as Record<string, string>)?.[key];
    if (val) return val;
  } catch {
    // Not in Cloudflare context (local dev)
  }
  return process.env[key] || "";
}

function dodoBase(mode: string): string {
  return mode === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

// Creates a Dodo payment and returns the payment link URL.
export async function POST(req: Request) {
  const { returnUrl } = (await req.json().catch(() => ({}))) as {
    returnUrl?: string;
  };

  const apiKey = await getEnv("DODO_PAYMENTS_API_KEY");
  const productId = await getEnv("DODO_PRODUCT_ID");
  const mode = (await getEnv("DODO_MODE")) || "test";

  if (!apiKey || !productId) {
    return NextResponse.json(
      { error: "Dodo Payments not configured", url: null },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${dodoBase(mode)}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing: {
          city: "Paris",
          country: "FR",
          state: "IDF",
          street: "Demo checkout",
          zipcode: "75001",
        },
        customer: {
          email: "demo@teamassemble.fr",
          name: "Assemble Demo User",
        },
        payment_link: true,
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: returnUrl || "https://assemble.yacine-baghli.workers.dev/",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Dodo returned ${res.status}`, detail: errorText, url: null },
        { status: 502 }
      );
    }

    const data = await res.json();
    const url = data.payment_link || data.checkout_url || data.url || null;
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, url: null },
      { status: 500 }
    );
  }
}
