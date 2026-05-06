export interface PalettePreset {
  name: string;
  colors: [string, string, string, string];
}

export const PALETTE_PRESETS: PalettePreset[] = [
  // Default — matches the initial store palette
  { name: 'Default',              colors: ['#b14444', '#2a7848', '#1c4880', '#d4941c'] },

  // Warm & earthy — dominant cluster on Etsy seamless patterns
  { name: 'Boho Terracotta',      colors: ['#F5ECD7', '#C4673A', '#8B9D6A', '#D4A96A'] },
  { name: 'Vintage Botanical',    colors: ['#EDE8D0', '#6B8F5E', '#C9A96E', '#A05C4A'] },
  { name: 'Rust & Linen Desert',  colors: ['#EDE0CC', '#B85C2A', '#C4A86A', '#7A6858'] },
  { name: 'Mushroom Forest',      colors: ['#D8CEBC', '#7A6850', '#4A6A4A', '#A89880'] },
  { name: 'Sunflower Prairie',    colors: ['#FBF4D8', '#E8A820', '#8B5E3C', '#7A9E5A'] },
  { name: '70s Retro Geometric',  colors: ['#E8C84A', '#C45E2A', '#5C7A3E', '#7A5C3A'] },

  // Soft & romantic
  { name: 'Cottagecore Wildflower', colors: ['#F7F0E6', '#D4849A', '#A8C4A2', '#E8D08A'] },
  { name: 'Berry Cottagecore',    colors: ['#F5ECF0', '#8B3060', '#5A7A3A', '#D4A8B8'] },
  { name: 'Watercolor Pastel',    colors: ['#FDF6F0', '#F2B5C0', '#B8D8E8', '#C8E6C0'] },
  { name: 'Dusty French Country', colors: ['#EDE8D8', '#8C6E8A', '#6A8C6E', '#C4A87A'] },
  { name: 'Blush & Gold Luxury',  colors: ['#FAF0EC', '#D4A87A', '#C48A96', '#6A5A4A'] },
  { name: 'Baby Nursery Neutral', colors: ['#F5F0E8', '#A8C4D4', '#D4B8A8', '#C8D8B0'] },

  // Botanical & nature
  { name: 'Sage & Cream',         colors: ['#F2EDE4', '#8FAE8B', '#C4B8A8', '#5A7A5A'] },
  { name: 'Dark Moody Botanical', colors: ['#1C2B2D', '#2E6B5E', '#8B1A2C', '#C9A84C'] },
  { name: 'Japanese Indigo',      colors: ['#1C2E4A', '#F0F4F8', '#4A6FA5', '#8BADC7'] },

  // Bold & saturated
  { name: 'Maximalist Jewel',     colors: ['#1A1035', '#2E8B5A', '#9B2D6F', '#C4962A'] },
  { name: 'Tropical Paradise',    colors: ['#0D7C6B', '#F4C842', '#E85D3A', '#F5EDD0'] },
  { name: 'Preppy Coastal',       colors: ['#F5F8FA', '#1B3A6B', '#E86A50', '#7FC4B8'] },
  { name: 'Deep Sea Nautical',    colors: ['#0C1E30', '#1E5F8A', '#C4802A', '#D4C8A8'] },
  { name: 'Scandinavian Folk',    colors: ['#F5F0E8', '#C42B2B', '#1E3A5F', '#4A7A4A'] },

  // Seasonal & festive
  { name: 'Vintage Christmas',    colors: ['#F5ECD8', '#8B2020', '#3A6B3A', '#C8A83A'] },
  { name: 'Halloween Harvest',    colors: ['#0E0A14', '#C85A1C', '#7A3A8A', '#E8D060'] },

  // Graphic & modern
  { name: 'Gothic Floral',        colors: ['#120A1C', '#6B2D8B', '#C42B4A', '#D4A83C'] },
  { name: 'Y2K Acid',             colors: ['#0D0D0D', '#A8F23A', '#FF2D8C', '#00E5FF'] },
  { name: 'Neon Memphis',         colors: ['#F5F5F5', '#FF4040', '#3A3AC8', '#FFD700'] },
  { name: 'Pastel Goth',          colors: ['#1A0A2E', '#D4A8D8', '#F0B8C8', '#9ADBD0'] },
  { name: 'The Matrix',           colors: ['#0A0A0A', '#00FF41', '#008F11', '#003B00'] },
];
