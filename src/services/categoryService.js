import supabase from './supabase.js';

/**
 * 59 YOLO Model classes mapped 1:1 to database records
 */
export const YOLO_CLASSES = [
  'plastic_bottle',
  'plastic_container',
  'plastic_cup',
  'plastic_bag',
  'plastic_wrapper',
  'polythene',
  'styrofoam',
  'plastic_scrap',
  'glass_bottle',
  'broken_glass',
  'glass_container',
  'beverage_can',
  'spray_can',
  'metal_container',
  'scrap_metal',
  'aluminium_foil',
  'foil_food_container',
  'steel_can',
  'cooking_pot',
  'cardboard_box',
  'cardboard_packaging',
  'paper',
  'white_paper',
  'brown_paper',
  'newspaper',
  'paper_cup',
  'tetra_pak',
  'book',
  'syringe',
  'mask',
  'glove',
  'medicine_pack',
  'gauze',
  'electronic_board_chip',
  'cable',
  'small_appliance',
  'laptop_computer',
  'mobile_tablet',
  'battery_cell',
  'clothing',
  'rag',
  'shoes',
  'bed',
  'chair',
  'dresser',
  'table',
  'sofa',
  'cabinet',
  'cooked_food_scraps',
  'fruit_vegetable_scraps',
  'garden_waste',
  'slippers',
  'general_stationary',
  'notebooks',
  'metal_supplies',
  'pens',
  'sharp_stationary',
  'pencils',
  'cigarette_butt',
];

/**
 * Normalizes model class string:
 * "plastic_bottle" -> "plastic bottle"
 */
export function normalizeClassName(rawClass) {
  if (!rawClass) return '';
  return String(rawClass).replace(/_/g, ' ').trim().toLowerCase();
}

/**
 * 59 Emoji Dictionary ensuring every category has an exact, attractive emoji
 */
export const CATEGORY_EMOJIS = {
  // Plastics
  plastic_bottle: '🍾',
  'plastic bottle': '🍾',
  plastic_container: '🫙',
  'plastic container': '🫙',
  plastic_cup: '🥤',
  'plastic cup': '🥤',
  plastic_bag: '🛍️',
  'plastic bag': '🛍️',
  plastic_wrapper: '🍬',
  'plastic wrapper': '🍬',
  polythene: '🛍️',
  styrofoam: '📦',
  plastic_scrap: '🧩',
  'plastic scrap': '🧩',

  // Glass
  glass_bottle: '🍾',
  'glass bottle': '🍾',
  broken_glass: '🔨',
  'broken glass': '🔨',
  glass_container: '🫙',
  'glass container': '🫙',

  // Metal
  beverage_can: '🥫',
  'beverage can': '🥫',
  spray_can: '🧴',
  'spray can': '🧴',
  metal_container: '🧰',
  'metal container': '🧰',
  scrap_metal: '🔩',
  'scrap metal': '🔩',
  aluminium_foil: '🌯',
  'aluminium foil': '🌯',
  foil_food_container: '🍱',
  'foil food container': '🍱',
  steel_can: '🥫',
  'steel can': '🥫',
  cooking_pot: '🍲',
  'cooking pot': '🍲',

  // Cardboard & Paper
  cardboard_box: '📦',
  'cardboard box': '📦',
  cardboard_packaging: '📦',
  'cardboard packaging': '📦',
  paper: '📄',
  white_paper: '📝',
  'white paper': '📝',
  brown_paper: '📜',
  'brown paper': '📜',
  newspaper: '📰',
  paper_cup: '☕',
  'paper cup': '☕',
  tetra_pak: '🧃',
  'tetra pak': '🧃',
  book: '📚',

  // Medical
  syringe: '💉',
  mask: '😷',
  glove: '🧤',
  medicine_pack: '💊',
  'medicine pack': '💊',
  gauze: '🩹',

  // E-waste
  electronic_board_chip: '💻',
  'electronic board chip': '💻',
  cable: '🔌',
  small_appliance: '📻',
  'small appliance': '📻',
  laptop_computer: '💻',
  'laptop computer': '💻',
  mobile_tablet: '📱',
  'mobile tablet': '📱',
  battery_cell: '🔋',
  'battery cell': '🔋',

  // Fabric
  clothing: '👕',
  rag: '🧵',
  shoes: '👟',

  // Furniture
  bed: '🛏️',
  chair: '🪑',
  dresser: '🗄️',
  table: '🪵',
  sofa: '🛋️',
  cabinet: '🚪',

  // Organic
  cooked_food_scraps: '🍲',
  'cooked food scraps': '🍲',
  fruit_vegetable_scraps: '🍎',
  'fruit vegetable scraps': '🍎',
  garden_waste: '🍂',
  'garden waste': '🍂',

  // Rubber
  slippers: '🩴',

  // Stationary
  general_stationary: '📐',
  'general stationary': '📐',
  notebooks: '📓',
  metal_supplies: '📎',
  'metal supplies': '📎',
  pens: '🖊️',
  sharp_stationary: '✂️',
  'sharp stationary': '✂️',
  pencils: '✏️',

  // Other
  cigarette_butt: '🚬',
  'cigarette butt': '🚬',
};

export function getCategoryEmoji(categoryOrName) {
  if (!categoryOrName) return '♻️';

  let name = '';
  let superCat = '';

  if (typeof categoryOrName === 'string') {
    name = categoryOrName.toLowerCase().trim();
  } else if (typeof categoryOrName === 'object') {
    name = (categoryOrName.name || '').toLowerCase().trim();
    superCat = (categoryOrName.super_category || '').toLowerCase().trim();
  }

  // Exact name match
  if (CATEGORY_EMOJIS[name]) return CATEGORY_EMOJIS[name];

  const withUnderscores = name.replace(/\s+/g, '_');
  if (CATEGORY_EMOJIS[withUnderscores]) return CATEGORY_EMOJIS[withUnderscores];

  // Super category fallbacks
  if (superCat.includes('plastic') || name.includes('plastic')) return '🧴';
  if (superCat.includes('glass') || name.includes('glass')) return '🍾';
  if (superCat.includes('metal') || name.includes('can') || name.includes('steel') || name.includes('aluminium')) return '🥫';
  if (superCat.includes('paper') || superCat.includes('cardboard') || name.includes('paper')) return '📄';
  if (superCat.includes('medical') || name.includes('medicine')) return '💉';
  if (superCat.includes('e-waste') || name.includes('battery') || name.includes('laptop') || name.includes('electronic')) return '🔌';
  if (superCat.includes('fabric') || name.includes('cloth')) return '👕';
  if (superCat.includes('furniture')) return '🪑';
  if (superCat.includes('organic') || name.includes('food') || name.includes('scrap')) return '🍎';
  if (superCat.includes('rubber')) return '🩴';
  if (superCat.includes('stationary') || name.includes('pen') || name.includes('pencil')) return '✏️';

  return '♻️';
}

/**
 * Container badge styling helper matching Figma design specs
 */
export function getContainerInfo(superCategory, name = '') {
  const cat = (superCategory || '').toLowerCase();
  const itemName = (name || '').toLowerCase();

  if (cat.includes('plastic')) {
    return {
      label: 'Yellow container',
      color: '#EAB308',
      bgColor: '#FEF9C3',
      textColor: '#854D0E',
      borderColor: '#FDE047',
    };
  }
  if (cat.includes('cardboard') || cat.includes('paper') || cat.includes('metal')) {
    return {
      label: 'Blue container',
      color: '#0284C7',
      bgColor: '#E0F2FE',
      textColor: '#0369A1',
      borderColor: '#BAE6FD',
    };
  }
  if (cat.includes('glass') || cat.includes('organic')) {
    return {
      label: 'Green container',
      color: '#16A34A',
      bgColor: '#DCFCE7',
      textColor: '#15803D',
      borderColor: '#BBF7D0',
    };
  }
  if (cat.includes('medical') || cat.includes('e-waste') || cat.includes('battery') || itemName.includes('battery')) {
    return {
      label: 'Red container',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
      borderColor: '#FECACA',
    };
  }
  return {
    label: 'Grey container',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    textColor: '#374151',
    borderColor: '#E5E7EB',
  };
}

/**
 * Generates tailored Environmental and Economic benefits based on category
 */
export function getCategoryBenefits(category) {
  const superCat = (category?.super_category || '').toLowerCase();
  const name = category?.name || 'this item';

  if (superCat === 'plastic') {
    return {
      environmental: `Recycling ${name} reduces pollution, conserves petroleum resources, and lowers greenhouse gas emissions by reusing materials instead of producing new plastic.`,
      economic: `It saves costs, creates jobs in recycling industries, and supports a circular economy by turning waste into valuable resources.`,
    };
  }
  if (superCat === 'glass') {
    return {
      environmental: `Glass is 100% infinitely recyclable without loss of purity or quality. Recycling saves energy and significantly curtails mining of raw silica and soda ash.`,
      economic: `Cullet melts at lower furnace temperatures, slashing industrial kiln energy consumption and providing steady income for local scrap collection networks.`,
    };
  }
  if (superCat === 'metal') {
    return {
      environmental: `Recycling ${name} saves up to 95% of the energy needed to refine virgin metals from bauxite or iron ore, reducing open-cast mining impact.`,
      economic: `Aluminium and scrap metals command high buyback prices from scrap dealers (kabadiwalas), injecting monetary value directly back into households.`,
    };
  }
  if (superCat.includes('paper') || superCat.includes('cardboard')) {
    return {
      environmental: `Recycling paper and cardboard protects forestry, preserves biodiversity, and cuts manufacturing water consumption by up to 60%.`,
      economic: `Reprocessed paper and corrugated cardboard form the backbone of modern low-cost shipping and e-commerce packaging.`,
    };
  }
  if (superCat === 'organic') {
    return {
      environmental: `Composting kitchen and garden scraps prevents toxic anaerobic decomposition in civic dumps and sequesters carbon into nutrient-rich topsoil.`,
      economic: `Produces natural manure, eliminating chemical fertilizer costs for urban gardens and driving community bio-methanation fuel savings.`,
    };
  }
  if (superCat === 'e-waste devices') {
    return {
      environmental: `Safeguards groundwater tables against hazardous heavy metals (lead, cadmium, mercury) and cuts down on intensive rare-earth mining.`,
      economic: `Recovers high-value gold, silver, copper, and cobalt from printed circuits, creating specialized circular tech refurbishment markets.`,
    };
  }
  if (superCat === 'medical') {
    return {
      environmental: `Safe segregation and designated disposal stops hazardous clinical contaminants from entering municipal sanitation streams and water bodies.`,
      economic: `Enables autoclaved polymers and metal components to re-enter safe, certified recovery pipelines without endangering sanitation workers.`,
    };
  }
  return {
    environmental: `Diverts valuable bulk items away from overburdened city landfills, preserving regional ecology and reducing urban waste footprints.`,
    economic: `Facilitates second-life reuse, upcycling initiatives, and charity redistribution through verified social and scrap aggregators.`,
  };
}

/**
 * Fetch category from Supabase by Model Class Name
 * e.g. "plastic_bottle" or "plastic bottle"
 */
export async function fetchCategoryByModelClass(className) {
  const normalized = normalizeClassName(className);
  if (!normalized) return null;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', normalized)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error for class:', normalized, error);
      return getFallbackCategoryByName(normalized);
    }

    if (data) return data;
  } catch (err) {
    console.warn('Network error fetching category:', err);
  }

  return getFallbackCategoryByName(normalized);
}

/**
 * Fetch category from Supabase by class_id (1-59)
 */
export async function fetchCategoryByClassId(classId) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('class_id', classId)
      .maybeSingle();

    if (!error && data) return data;
  } catch (err) {
    console.warn('Error fetching class_id:', classId, err);
  }

  return getFallbackCategoryById(classId);
}

/**
 * Search categories for the Home search bar
 */
export async function searchCategories(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('class_id, name, super_category, is_recyclable')
      .or(`name.ilike.%${q}%,super_category.ilike.%${q}%`)
      .limit(10);

    if (!error && data && data.length > 0) return data;
  } catch (err) {
    console.warn('Error searching categories:', err);
  }

  // Fallback search across local YOLO classes
  return YOLO_CLASSES
    .map((raw, idx) => ({
      class_id: idx + 1,
      name: normalizeClassName(raw),
      super_category: getSuperCategoryForClass(raw),
      is_recyclable: true,
    }))
    .filter(item => item.name.includes(q) || item.super_category.includes(q))
    .slice(0, 10);
}

function getSuperCategoryForClass(raw) {
  if (raw.startsWith('plastic') || raw === 'polythene' || raw === 'styrofoam') return 'plastic';
  if (raw.includes('glass')) return 'glass';
  if (raw.includes('metal') || raw.includes('can') || raw.includes('aluminium') || raw.includes('pot')) return 'metal';
  if (raw.includes('paper') || raw.includes('cardboard') || raw === 'book' || raw === 'tetra_pak') return 'cardboard and paper';
  if (raw === 'syringe' || raw === 'mask' || raw === 'glove' || raw === 'medicine_pack' || raw === 'gauze') return 'medical';
  if (raw.includes('chip') || raw.includes('cable') || raw.includes('appliance') || raw.includes('laptop') || raw.includes('tablet') || raw.includes('battery')) return 'e-waste devices';
  if (raw === 'clothing' || raw === 'rag' || raw === 'shoes') return 'fabric';
  if (raw === 'bed' || raw === 'chair' || raw === 'dresser' || raw === 'table' || raw === 'sofa' || raw === 'cabinet') return 'furniture';
  if (raw.includes('scraps') || raw.includes('waste')) return 'organic';
  if (raw === 'slippers') return 'rubber';
  if (raw.includes('stationary') || raw === 'notebooks' || raw === 'pens' || raw === 'pencils') return 'stationary';
  return 'other';
}

/**
 * Fallback helpers ensuring screens never crash
 */
function getFallbackCategoryByName(name) {
  const index = YOLO_CLASSES.findIndex(c => normalizeClassName(c) === name);
  const classId = index >= 0 ? index + 1 : 1;
  return getFallbackCategoryById(classId, name);
}

function getFallbackCategoryById(classId, customName = null) {
  const index = Math.max(0, Math.min(classId - 1, YOLO_CLASSES.length - 1));
  const rawClass = YOLO_CLASSES[index];
  const name = customName || normalizeClassName(rawClass);
  const superCat = getSuperCategoryForClass(rawClass);

  return {
    id: classId,
    class_id: classId,
    name: name,
    super_category: superCat,
    disposal_advice: [
      `Check the item condition and separate non-recyclable components before disposal`,
      `Empty, clean, and rinse off any residue or contaminants`,
      `Keep dry and store separately from organic wet waste`,
      `Hand over to your local municipal dry waste collector or authorized scrap dealer`,
    ],
    recycling_options: [
      `Accepted by local scrap dealers (kabadiwalas) and municipal Material Recovery Facilities (MRFs)`,
      `Processed by authorized recycling and upcycling facilities into recycled raw materials`,
    ],
    dos: [
      `Clean and rinse off dirt, grease, or liquids before storing`,
      `Flatten or bundle items together to reduce volume`,
      `Segregate from organic and hazardous waste streams`,
      `Hand over to certified recycling channels or scrap dealers`,
    ],
    donts: [
      `Don't dispose of items into wet or biodegradable organic bins`,
      `Don't burn waste openly — burning releases harmful toxins`,
      `Don't dump items in waterways, storm drains, or vacant plots`,
      `Don't mix sharp or hazardous items loosely with common dry recyclables`,
    ],
    description: `${name.charAt(0).toUpperCase() + name.slice(1)} item in the ${superCat} category.`,
    is_recyclable: true,
  };
}
