// services/blogScraper.js
// Curated, real articles from credible sources (links checked September 2026).
// `category` must match the Home screen filter labels exactly.
// `urgency` is the badge label shown on the card.

const INDIA = '#1B5E20';
const GLOBAL = '#0369A1';
const DATA = '#475569';

const ARTICLES = [
  {
    id: 'orf-deonar-2026',
    title: "Mumbai's Deonar Landfill: From Toxic Legacy to Climate Asset",
    snippet:
      "India's oldest dumpsite still takes in thousands of tonnes of Mumbai's waste every day. The authors argue for capturing its landfill gas and planting mangroves instead of burning the waste.",
    category: 'Textiles & Organic Waste',
    urgency: 'MUMBAI',
    accentColor: INDIA,
    source: 'Observer Research Foundation',
    date: 'May 2026',
    link: 'https://www.orfonline.org/expert-speak/mumbai-s-deonar-landfill-from-toxic-legacy-to-climate-asset',
  },
  {
    id: 'dte-plastic-epr-2026',
    title: 'Plastic regime needs transparency',
    snippet:
      "India says it has recycled millions of tonnes of plastic packaging under its producer-responsibility rules, yet plastic is still everywhere. A look at the gaps in the official recycling data.",
    category: 'Plastics',
    urgency: 'INDIA',
    accentColor: INDIA,
    source: 'Down To Earth',
    date: 'Sep 2026',
    link: 'https://www.downtoearth.org.in/waste/plastic-regime-needs-transparency',
  },
  {
    id: 'row-ewaste-india-2025',
    title: 'The dirty truth behind the e-waste recycling industry',
    snippet:
      "India is one of the world's biggest e-waste producers, and most of the dismantling is still done by informal workers in unsafe conditions for very little pay.",
    category: 'E-Waste',
    urgency: 'INDIA',
    accentColor: INDIA,
    source: 'Rest of World',
    date: 'Aug 2025',
    link: 'https://restofworld.org/2025/india-e-waste-recycling-electronics/',
  },
  {
    id: 'who-ewaste',
    title: 'Electronic waste (e-waste)',
    snippet:
      "The world throws away tens of millions of tonnes of electronics a year and formally recycles less than a quarter. Unsafe recycling exposes children and pregnant women to toxic chemicals like lead.",
    category: 'E-Waste',
    urgency: 'FACT SHEET',
    accentColor: GLOBAL,
    source: 'World Health Organization',
    date: 'Oct 2024',
    link: 'https://www.who.int/news-room/fact-sheets/detail/electronic-waste-(e-waste)',
  },
  {
    id: 'unep-microplastics',
    title: 'Microplastics: The long legacy left behind by plastic pollution',
    snippet:
      'Most plastic ever made ends up as waste, and it breaks down into tiny particles that reach oceans, food and even the human body. Some also come straight from clothes and cosmetics.',
    category: 'Plastics',
    urgency: 'EXPLAINER',
    accentColor: GLOBAL,
    source: 'UN Environment Programme',
    date: 'Apr 2023',
    link: 'https://www.unep.org/news-and-stories/story/microplastics-long-legacy-left-behind-plastic-pollution',
  },
  {
    id: 'unep-food-waste-2024',
    title: 'World squanders over 1 billion meals a day',
    snippet:
      "About a fifth of the world's food is wasted, most of it at home, while millions go hungry. Rotting food waste is also a major source of greenhouse gases.",
    category: 'Textiles & Organic Waste',
    urgency: 'REPORT',
    accentColor: GLOBAL,
    source: 'UN Environment Programme',
    date: 'Mar 2024',
    link: 'https://www.unep.org/news-and-stories/press-release/world-squanders-over-1-billion-meals-day-un-report',
  },
  {
    id: 'unep-fast-fashion',
    title: 'The environmental costs of fast fashion',
    snippet:
      "We buy far more clothes than before and wear them for less time. The equivalent of a truckload of textiles is dumped or burned every second.",
    category: 'Textiles & Organic Waste',
    urgency: 'EXPLAINER',
    accentColor: GLOBAL,
    source: 'UN Environment Programme',
    date: 'Nov 2022',
    link: 'https://www.unep.org/news-and-stories/story/environmental-costs-fast-fashion',
  },
  {
    id: 'who-healthcare-waste',
    title: 'Health-care waste',
    snippet:
      'Most hospital waste is ordinary rubbish, but the rest can be infectious, toxic or radioactive. Used needles that are not disposed of safely cause injuries and spread disease.',
    category: 'Hazardous Scrap',
    urgency: 'FACT SHEET',
    accentColor: GLOBAL,
    source: 'World Health Organization',
    date: 'Oct 2024',
    link: 'https://www.who.int/news-room/fact-sheets/detail/health-care-waste',
  },
  {
    id: 'epa-lithium-batteries',
    title: 'Used Lithium-Ion Batteries',
    snippet:
      'Phone and laptop batteries should never go in the regular bin. They can be crushed in garbage trucks and start fires, and they contain valuable metals that can be recovered.',
    category: 'Hazardous Scrap',
    urgency: 'GUIDE',
    accentColor: DATA,
    source: 'US EPA',
    date: 'Updated Mar 2026',
    link: 'https://www.epa.gov/recycle/used-lithium-ion-batteries',
  },
  {
    id: 'iai-aluminium-recycling',
    title: 'Aluminium recycling saves 95% of the energy needed for primary production',
    snippet:
      'Melting down scrap aluminium takes a tiny fraction of the energy needed to make new metal from ore, which is why cans and foil are worth recycling.',
    category: 'Metals',
    urgency: 'FACT',
    accentColor: DATA,
    source: 'International Aluminium Institute',
    date: '',
    link: 'https://international-aluminium.org/landing/aluminium-recycling-saves-95-of-the-energy-needed-for-primary-aluminium-production/',
  },
  {
    id: 'epa-paper',
    title: 'Paper and Paperboard: Material-Specific Data',
    snippet:
      'Paper and cardboard are the largest part of household waste, but also the most recycled material. Cardboard boxes are recycled far more often than other paper packaging.',
    category: 'Paper & Cardboard',
    urgency: 'DATA',
    accentColor: DATA,
    source: 'US EPA',
    date: 'Updated Oct 2025',
    link: 'https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/paper-and-paperboard-material-specific-data',
  },
  {
    id: 'epa-glass',
    title: 'Glass: Material-Specific Data',
    snippet:
      'Most glass waste is bottles and jars. Only about a third of glass containers get recycled, and the rest mostly ends up in landfill.',
    category: 'Glass',
    urgency: 'DATA',
    accentColor: DATA,
    source: 'US EPA',
    date: 'Updated Mar 2026',
    link: 'https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/glass-material-specific-data',
  },
  {
    id: 'mongabay-ewaste-explainer',
    title: 'The why and how of disposing electronic waste',
    snippet:
      "India is among the top producers of e-waste in the world. This explainer covers why old electronics are harmful and how to reuse, repair and recycle them safely.",
    category: 'E-Waste',
    urgency: 'EXPLAINER',
    accentColor: INDIA,
    source: 'Mongabay India',
    date: 'Aug 2020',
    link: 'https://india.mongabay.com/2020/08/explainer-the-why-and-how-of-disposing-electronic-waste/',
  },
];

export async function fetchScrapImpactBlogs() {
  return ARTICLES;
}
