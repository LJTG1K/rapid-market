import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    gtag?: Function;
  }
}

interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
  brand?: string;
  verified?: boolean;
}

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Deslugify function
  const deslugify = (slug: string): string => {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Fetch products
  useEffect(() => {
    if (!slug) return;

    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const allProducts = await response.json();

        // Find product by slug
        const productName = deslugify(slug as string);
        const foundProduct = allProducts.find(
          (p: Product) => p.name.toLowerCase() === productName.toLowerCase()
        );

        if (foundProduct) {
          setProduct(foundProduct);

          // Get related products (same brand or category)
          const related = allProducts.filter(
            (p: Product) =>
              p.id !== foundProduct.id &&
              (p.brand === foundProduct.brand || p.category === foundProduct.category)
          );
          setRelatedProducts(related.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  // Track click
  const trackClick = async (productId: string, productName: string) => {
    // Send to GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        items: [
          {
            item_id: productId,
            item_name: productName,
            item_category: product?.category,
            item_brand: product?.brand,
            price: product?.price.replace('$', ''),
          },
        ],
      });
    }

    // Log to backend
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, type: 'product-click' }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-2xl font-bold">Product not found</p>
        <Link href="/fashion-listings" className="text-blue-600 hover:text-blue-800 font-bold">
          ← Back to Listings
        </Link>
      </div>
    );
  }

  // Generate JSON-LD schemas
  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'RAPID',
    },
    offers: {
      '@type': 'Offer',
      url: product.sugargooLink,
      priceCurrency: 'USD',
      price: product.price.replace('$', ''),
      availability: 'https://schema.org/InStock',
    },
    category: product.category,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://rapid.market',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Listings',
        item: 'https://rapid.market/fashion-listings',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://rapid.market/fashion-listings/${slug}`,
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{product.name} - RAPID</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.name} - RAPID`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - RAPID`} />
        <meta name="twitter:description" content={product.description} />
        <meta name="twitter:image" content={product.image} />
        <link rel="canonical" href={`https://rapid.market/fashion-listings/${slug}`} />

        {/* Product Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
        {/* Breadcrumb Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back Link */}
          <Link href="/fashion-listings" className="text-blue-600 hover:text-blue-800 font-bold mb-8 inline-block">
            ← Back to Listings
          </Link>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Product Image */}
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8" style={{ minHeight: '400px' }}>
              <img
                src={product.image}
                alt={`${product.name} - ${product.category} from ${product.brand || 'RAPID'}`}
                loading="lazy"
                className="w-full h-auto object-contain max-h-96"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/400x400?text=Product';
                }}
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-start gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>
                  {product.name}
                </h1>
                <p className="text-gray-600 text-lg mb-4">{product.description}</p>

                {product.brand && (
                  <Link
                    href={`/brands`}
                    className="text-blue-600 hover:text-blue-800 font-bold inline-block mb-4"
                  >
                    Brand: {product.brand} →
                  </Link>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <span
                    className="bg-gray-200 text-black px-6 py-3 rounded-full text-2xl font-bold"
                    style={{ fontFamily: 'Jaro' }}
                  >
                    {product.price}
                  </span>
                  {product.verified && (
                    <span className="bg-rapid-green text-black px-4 py-2 rounded-full font-bold">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-sm text-gray-600 mb-6">
                  <p>
                    <strong>Category:</strong> {product.category}
                  </p>
                  {product.brand && (
                    <p>
                      <strong>Brand:</strong> {product.brand}
                    </p>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <a
                href={product.sugargooLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(product.id, product.name)}
                className="w-full text-center block bg-rapid-orange text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg uppercase"
                style={{ fontFamily: 'Jaro' }}
              >
                Buy on Sugargoo
              </a>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-3xl font-black mb-8 uppercase" style={{ fontFamily: 'Jaro' }}>
                Related Products
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relProduct) => {
                  const productSlug = relProduct.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                  return (
                    <Link
                      key={relProduct.id}
                      href={`/fashion-listings/${productSlug}`}
                      className="card bg-white border-2 border-black hover:shadow-2xl transition-shadow shadow-lg flex flex-col"
                    >
                      <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center w-full" style={{ minHeight: '150px' }}>
                        <img
                          src={relProduct.image}
                          alt={relProduct.name}
                          className="w-full h-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/300x300?text=Product';
                          }}
                        />
                      </div>
                      <h3 className="font-black text-sm mb-2">{relProduct.name}</h3>
                      <p className="text-xs text-gray-600 mb-4 flex-grow">{relProduct.description}</p>
                      <div className="flex gap-2 items-center">
                        <span className="bg-gray-200 text-black px-3 py-1 rounded-full text-sm font-bold">
                          {relProduct.price}
                        </span>
                        {relProduct.verified && (
                          <span className="bg-rapid-green text-black px-2 py-1 rounded-full text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
