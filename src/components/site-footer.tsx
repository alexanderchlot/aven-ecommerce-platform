import Link from "next/link";

const columns = [
  {
    title: "Client Service",
    links: ["Contact us", "Shipping", "Returns & exchanges", "Size guide"],
  },
  {
    title: "The House",
    links: ["Our story", "Craftsmanship", "Sustainability", "Careers"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms of sale", "Cookie settings", "Accessibility"],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl uppercase tracking-[0.3em]">AVEN</p>
          <p className="caption mt-4 max-w-xs">
            Considered wardrobe essentials, made to be worn for years.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="label mb-4">{col.title}</h2>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l}>
                  <Link href="#" className="link-quiet caption">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page border-t py-6">
        <p className="caption">© AVEN. Sample storefront; photography via Unsplash.</p>
      </div>
    </footer>
  );
}
