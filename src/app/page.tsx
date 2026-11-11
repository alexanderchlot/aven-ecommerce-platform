import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductCard } from "@/components/product-card";
import {
  FREE_SHIPPING_THRESHOLD_ORE,
  formatPrice,
  images,
} from "@/lib/catalog";
import {
  getHomeCategories,
  getProductBySlug,
  getProducts,
} from "@/lib/queries";

const services = [
  {
    title: "Complimentary shipping",
    text: `On every order over ${formatPrice(FREE_SHIPPING_THRESHOLD_ORE)}.`,
  },
  { title: "Thirty-day returns", text: "Free and simple, no questions." },
  { title: "Gift wrapping", text: "Signature packaging on request." },
  { title: "Client service", text: "Available seven days a week." },
];

export default async function Home() {
  const [products, collections, spotlight] = await Promise.all([
    getProducts(8),
    getHomeCategories(),
    getProductBySlug("camel-wool-coat"),
  ]);

  return (
    <>
      {/* Hero: two-up editorial on desktop, single image on phones */}
      <section aria-labelledby="hero-title" className="split">
        <div className="scrim relative h-[78svh] min-h-[30rem] md:h-[calc(100svh-7rem)] md:min-h-[36rem]">
          <Image
            src={images.heroPrimary}
            alt="A woman in a burgundy coat and sunglasses carrying shopping bags"
            fill
            priority
            sizes="(min-width: 48rem) 50vw, 100vw"
            className="object-cover object-top"
          />
          <div className="scrim__content">
            <p className="eyebrow !text-white/80">Autumn / Winter</p>
            <h1 id="hero-title" className="display mt-3 max-w-[12ch]">
              The Winter Edit
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/collections/women" className="btn btn-light">
                Shop women
              </Link>
              <Link href="/collections/men" className="btn btn-light">
                Shop men
              </Link>
            </div>
          </div>
        </div>
        <div className="relative hidden h-[calc(100svh-7rem)] min-h-[36rem] md:block">
          <Image
            src={images.heroSecondary}
            alt="A woman in a pale blue coat in front of a Gothic cathedral"
            fill
            priority
            sizes="50vw"
            className="object-cover object-top"
          />
        </div>
      </section>

      {/* Featured collections */}
      <section className="section" aria-labelledby="collections-title">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Explore</p>
              <h2 id="collections-title" className="heading-1 mt-2">
                Shop by collection
              </h2>
            </div>
            <Link href="/collections" className="btn btn-ghost only-desktop">
              View all
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
            {collections.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="scrim media-frame group block"
                >
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    sizes="(min-width: 64rem) 25vw, 50vw"
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="scrim__content">
                    <span className="heading-2">{c.title}</span>
                    <span className="label mt-2 block underline underline-offset-4">
                      Discover
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* New arrivals */}
      <section className="section-sm" aria-labelledby="new-title">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Just landed</p>
              <h2 id="new-title" className="heading-1 mt-2">
                New arrivals
              </h2>
            </div>
            <Link href="/collections/new" className="btn btn-ghost">
              Shop all
            </Link>
          </div>
          <div className="grid-products">
            {products.map((p, i) => (
              <ProductCard key={p.slug} product={p} priority={i < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial story: image left, copy right */}
      <section className="section" aria-labelledby="story-title">
        <div className="split">
          <div className="media-frame !aspect-[4/5] md:!aspect-auto md:min-h-[40rem]">
            <Image
              src={images.editorialRack}
              alt="Neutral blouses and knits on wooden hangers"
              fill
              sizes="(min-width: 48rem) 50vw, 100vw"
            />
          </div>
          <div className="surface-stone flex flex-col justify-center gap-6 px-gutter py-16 md:px-16">
            <p className="eyebrow">The AVEN approach</p>
            <h2 id="story-title" className="heading-1 max-w-[16ch]">
              Made slowly, worn for years
            </h2>
            <p className="max-w-md text-ink-soft">
              Natural fibres, considered cuts and a quiet palette. Each piece is
              designed to move between seasons and sit comfortably with
              everything you already own.
            </p>
            <div>
              <Link href="/about" className="btn btn-secondary">
                Our story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product spotlight: copy left, image right (reversed on desktop) */}
      {spotlight ? (
        <section className="pb-section" aria-labelledby="spotlight-title">
          <div className="split">
            <div className="flex flex-col justify-center gap-5 px-gutter py-12 md:px-16 md:py-16 order-2 md:order-1">
              <p className="eyebrow">Featured piece</p>
              <h2 id="spotlight-title" className="heading-1">
                {spotlight.name}
              </h2>
              <p className="max-w-md text-ink-soft">{spotlight.description}</p>
              <p className="heading-3">{formatPrice(spotlight.price)}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/products/${spotlight.slug}`}
                  className="btn btn-primary btn-block-mobile"
                >
                  View product
                </Link>
              </div>
            </div>
            <div className="media-frame !aspect-[4/5] md:!aspect-auto md:min-h-[40rem] order-1 md:order-2">
              <Image
                src={images.spotlight}
                alt={spotlight.alt}
                fill
                sizes="(min-width: 48rem) 50vw, 100vw"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* Services */}
      <section aria-label="Services" className="border-y">
        <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.title}>
              <h3 className="label">{s.title}</h3>
              <p className="caption mt-2">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Newsletter */}
      <section className="section" aria-labelledby="newsletter-title">
        <div className="container-narrow flex flex-col items-center gap-6 text-center">
          <p className="eyebrow">Stay in touch</p>
          <h2 id="newsletter-title" className="heading-1">
            Be the first to know
          </h2>
          <p className="max-w-md text-ink-soft">
            New collections, private sales and stories from the studio.
          </p>
          <div className="w-full max-w-xl text-left">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
