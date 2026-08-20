import { permanentRedirect } from "next/navigation";

// The board moved to the landing page — permanently redirect old links,
// keeping any ?q=&category= search params. /products/[id] stays unchanged.
export default async function ProductsRedirect({ searchParams }) {
  const params = new URLSearchParams(await searchParams);
  const qs = params.toString();
  permanentRedirect(qs ? `/?${qs}` : "/");
}
