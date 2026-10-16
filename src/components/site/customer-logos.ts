export interface CustomerLogo {
  name: string;
  file: string;
  width: number;
  height: number;
  tall?: boolean;
}

// Customer logos served from /site/logos/customers/. Used by the homepage
// CustomerLogoCarousel and the /wall-of-love "Trusted by" section.
export const customerLogos: CustomerLogo[] = [
  { name: 'Megaport', file: 'megaport.webp', width: 800, height: 230 },
  { name: 'Mezmo', file: 'mezmo.png', width: 2266, height: 563 },
  { name: 'Vitess', file: 'vitess.svg', width: 389, height: 416, tall: true },
  { name: 'Helm', file: 'helm.svg', width: 304, height: 351, tall: true },
  { name: 'Aptible', file: 'aptible.avif', width: 888, height: 184 },
  { name: 'Runpod', file: 'runpod.png', width: 1200, height: 355 },
  { name: 'Flatfile', file: 'flatfile.png', width: 1815, height: 420 },
  { name: 'Latitude', file: 'latitude.svg', width: 5544, height: 1001 },
  { name: 'Mautic', file: 'mautic.png', width: 1511, height: 395 },
  { name: 'Vellum', file: 'vellum.png', width: 500, height: 186 },
  { name: 'Coactive', file: 'coactive.png', width: 2400, height: 440 },
  { name: 'Rain', file: 'rain.png', width: 958, height: 291 },
  { name: 'Miter', file: 'miter.svg', width: 112, height: 26 },
  { name: 'Basis', file: 'basis.svg', width: 1200, height: 347 },
];
