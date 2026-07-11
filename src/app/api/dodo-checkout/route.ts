import { NextResponse } from "next/server";

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY || "";
const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID || "";
const DODO_MODE = process.env.DODO_MODE || "test";

function dodoBase(): string {
  return DODO_MODE === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

// Creates a Dodo checkout session and returns the checkout URL.
export async function POST(req: Request) {
  const { returnUrl } = (await req.json().catch(() => ({}))) as {
    returnUrl?: string;
  };

  if (!DODO_API_KEY || !DODO_PRODUCT_ID) {
    return NextResponse.json(
      { error: "Dodo Payments not configured", url: null },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${dodoBase()}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
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
        product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
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
