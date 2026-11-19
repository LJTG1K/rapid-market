// Category links shared by the header's Shop panel, the mobile menu and the
// homepage category tiles, so the three never drift apart.
export interface NavCategory {
  label: string;
  href: string;
  /** Category name as products carry it (lib/products.ts), for picking a tile photo. */
  match: string;
}

export const FASHION_CATEGORIES: NavCategory[] = [
  { label: 'T-shirts', href: '/fashion-listings?category=t-shirts', match: 'T-Shirts' },
  { label: 'Hoodies', href: '/fashion-listings?category=hoodies', match: 'Hoodies' },
  { label: 'Jackets', href: '/fashion-listings?category=jackets', match: 'Jackets' },
  { label: 'Pants', href: '/fashion-listings?category=pants', match: 'Pants' },
  { label: 'Outerwear', href: '/fashion-listings?category=outerwear', match: 'Outerwear' },
  { label: 'Bags', href: '/fashion-listings?category=bags', match: 'Bags' },
  { label: 'Accessories', href: '/fashion-listings?category=accessories', match: 'Accessories' },
];

export const TECH_CATEGORIES: NavCategory[] = [
  { label: 'Gaming', href: '/tech-listings?category=gaming', match: 'Gaming' },
  { label: 'Audio', href: '/tech-listings?category=audio', match: 'Audio' },
  { label: 'Lighting', href: '/tech-listings?category=lighting', match: 'Lighting' },
  { label: 'Phone cases', href: '/phone-cases', match: 'Phone Cases' },
  { label: 'Phone accessories', href: '/tech-listings?category=phone-accessories', match: 'Phone Accessories' },
  { label: 'Desk setup', href: '/tech-listings?category=desk-setup', match: 'Desk Setup' },
  { label: 'Skins & wraps', href: '/tech-listings?category=skins-wraps', match: 'Skins & Wraps' },
];

export const DISCOVER_LINKS = [
  { label: 'Brands', href: '/brands' },
  { label: "Gilly's Picks", href: '/gillys-picks' },
];

export const HELP_LINKS = [
  { label: 'How buying works', href: '/tutorial' },
  { label: 'Journal', href: '/blog' },
];
