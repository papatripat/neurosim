import { ColorOption, SelectOption, CharacterCustomization, CharacterPreset } from '../types/character';

// ---------------------------------------------------------------------------
// 1. Color Palettes (Harmonized with Universal LPC + Project Palette)
// ---------------------------------------------------------------------------

export const SKIN_TONES: ColorOption[] = [
  { id: 'pale', name: 'Putih Terang (Pale)', hex: '#f9d5b8' },
  { id: 'peach', name: 'Kuning Langsat (Peach)', hex: '#eec29a' },
  { id: 'olive', name: 'Sawo Matang Cerah (Warm Olive)', hex: '#d29a6b' },
  { id: 'tan', name: 'Sawo Matang (Golden Tan)', hex: '#b57849' },
  { id: 'bronze', name: 'Cokelat Hangat (Rich Bronze)', hex: '#87512b' },
  { id: 'dark', name: 'Cokelat Gelap (Deep Espresso)', hex: '#523018' },
];

export const HAIR_COLORS: ColorOption[] = [
  { id: 'black', name: 'Hitam Pekat', hex: '#211f26' },
  { id: 'dark-brown', name: 'Cokelat Tua', hex: '#3b281d' },
  { id: 'caramel', name: 'Cokelat Karamel', hex: '#6e472a' },
  { id: 'chestnut', name: 'Pirang Tembaga (Chestnut)', hex: '#94542d' },
  { id: 'blonde', name: 'Pirang Pasir (Ash Blonde)', hex: '#cbb387' },
  { id: 'gray', name: 'Abu-abu Perak (Silver Slate)', hex: '#848a96' },
  { id: 'burgundy', name: 'Merah Marun (Wine)', hex: '#63252a' },
  { id: 'navy', name: 'Biru Midnight', hex: '#243247' },
];

export const EYE_COLORS: ColorOption[] = [
  { id: 'dark-brown', name: 'Cokelat Tua', hex: '#3d2516' },
  { id: 'hazel', name: 'Hazel / Karamel', hex: '#7a542b' },
  { id: 'ocean-blue', name: 'Biru Laut', hex: '#396b8a' },
  { id: 'forest-green', name: 'Hijau Lumut', hex: '#3d6148' },
  { id: 'slate-gray', name: 'Abu-abu Dingin', hex: '#5f6770' },
  { id: 'black', name: 'Hitam Jet', hex: '#1e1e24' },
];

export const SHIRT_COLORS: ColorOption[] = [
  { id: 'white', name: 'Putih Bersih (Oxford White)', hex: '#f5f5f7' },
  { id: 'sky-blue', name: 'Biru Muda Kantor (Light Blue)', hex: '#a4c6e0' },
  { id: 'slate-teal', name: 'Slate Teal (Warna Tema)', hex: '#355c5a' },
  { id: 'cream', name: 'Krem Alami (Parchment)', hex: '#e8dcbe' },
  { id: 'charcoal', name: 'Abu Gelap (Charcoal)', hex: '#3a3f4a' },
  { id: 'navy', name: 'Biru Dongker (Navy)', hex: '#202a40' },
  { id: 'sage', name: 'Hijau Sage Lembut', hex: '#557a62' },
  { id: 'terracotta', name: 'Terracotta Bata', hex: '#8c4b3f' },
];

export const SUIT_COLORS: ColorOption[] = [
  { id: 'navy-suit', name: 'Navy Eksekutif', hex: '#1c2436' },
  { id: 'charcoal-suit', name: 'Abu Arang Formal', hex: '#2c3038' },
  { id: 'black-suit', name: 'Hitam Pekat', hex: '#17181c' },
  { id: 'slate-suit', name: 'Slate Gray', hex: '#485263' },
  { id: 'brown-suit', name: 'Cokelat Kayu Tweed', hex: '#4a3628' },
  { id: 'beige-suit', name: 'Khaki Beige Santai', hex: '#b0a082' },
];

export const TIE_COLORS: ColorOption[] = [
  { id: 'crimson', name: 'Merah Marun Formal', hex: '#87232b' },
  { id: 'gold', name: 'Kuning Kuningan (Brass)', hex: '#c99632' },
  { id: 'deep-navy', name: 'Biru Dongker Klasik', hex: '#18243b' },
  { id: 'forest', name: 'Hijau Zamrud', hex: '#245938' },
  { id: 'silver', name: 'Perak Polos', hex: '#a4abb8' },
  { id: 'black', name: 'Hitam Dasi', hex: '#1a1a1f' },
];

export const PANTS_COLORS: ColorOption[] = [
  { id: 'charcoal', name: 'Abu Arang Gelap', hex: '#2b2f38' },
  { id: 'black', name: 'Hitam Formal', hex: '#1b1c21' },
  { id: 'navy', name: 'Biru Dongker', hex: '#1e283b' },
  { id: 'khaki', name: 'Khaki / Krem Chino', hex: '#a8987b' },
  { id: 'dark-brown', name: 'Cokelat Kopi', hex: '#453325' },
  { id: 'dark-denim', name: 'Biru Denim Gelap', hex: '#2e3a52' },
];

export const SHOES_COLORS: ColorOption[] = [
  { id: 'black-leather', name: 'Kulit Hitam Mengkilap', hex: '#1f1e24' },
  { id: 'dark-brown', name: 'Kulit Cokelat Tua', hex: '#3d2b1f' },
  { id: 'cognac-tan', name: 'Kulit Tan / Cognac', hex: '#7a4f2f' },
  { id: 'white-sneaker', name: 'Putih Bersih', hex: '#e8edf2' },
  { id: 'gray-suede', name: 'Suede Abu-abu', hex: '#5b616b' },
];

// ---------------------------------------------------------------------------
// 2. Selectable Components (Mirroring Universal LPC Categories)
// ---------------------------------------------------------------------------

export const HAIR_STYLES: SelectOption[] = [
  { id: 'short-parted', name: 'Belah Samping Rapi', description: 'Gaya kantoran profesional belah samping' },
  { id: 'slicked-back', name: 'Sisir Belakang (Slicked)', description: 'Gaya formal klimis rapi ke belakang' },
  { id: 'messy-crop', name: 'Crop Kasual Rapi', description: 'Potongan rambut pendek modern sedikit bertumpuk' },
  { id: 'pixie-cut', name: 'Potongan Pixie', description: 'Gaya pendek elegan untuk wanita kerja' },
  { id: 'office-bun', name: 'Sanggul Kantor (Chignon)', description: 'Rambut disanggul rapi ke belakang' },
  { id: 'ponytail', name: 'Kuncir Kuda Dinamis', description: 'Kuncir satu praktis dan energik' },
  { id: 'shoulder-waves', name: 'Sebahu Bergelombang', description: 'Rambut panjang sedang terurai anggun' },
  { id: 'afro-fade', name: 'Afro Fade Pendek', description: 'Gaya rambut ikal padat dengan gradasi samping' },
  { id: 'buzz-cut', name: 'Cepak Rapi (Buzz Cut)', description: 'Potongan minimalis sangat pendek' },
  { id: 'bald', name: 'Botak Bersih (Bald)', description: 'Kepala plontos licin dan berwibawa' },
];

export const FACIAL_HAIR_OPTIONS: SelectOption[] = [
  { id: 'none', name: 'Cukur Bersih (Clean Shaven)', description: 'Tanpa kumis atau jenggot' },
  { id: 'neat-mustache', name: 'Kumis Rapi Tertata', description: 'Kumis tipis rapi di atas bibir' },
  { id: 'stubble', name: 'Kumis & Jenggot Tipis (Stubble)', description: 'Bayangan brewok tipis maskulin' },
  { id: 'goatee', name: 'Jenggot Dagu (Goatee)', description: 'Jenggot terpusat di area dagu' },
  { id: 'full-beard', name: 'Jenggot Penuh Tertata', description: 'Jenggot lebat yang disisir rapi formal' },
];

export const GLASSES_OPTIONS: SelectOption[] = [
  { id: 'none', name: 'Tanpa Kacamata', description: 'Wajah bebas tanpa aksesoris optik' },
  { id: 'wire-frame', name: 'Kacamata Kawat Bulat', description: 'Bingkai logam tipis intelektual' },
  { id: 'horn-rimmed', name: 'Bingkai Tebal Klasik (Horn-Rimmed)', description: 'Bingkai asetat hitam tegas profesional' },
  { id: 'reading-oval', name: 'Kacamata Baca Oval', description: 'Bingkai kecil ringan untuk membaca layar' },
  { id: 'sunglasses', name: 'Kacamata Gelap (Aviator)', description: 'Gaya trendi untuk aktivitas luar ruangan' },
];

export const SHIRT_OPTIONS: SelectOption[] = [
  { id: 'collared-formal', name: 'Kemeja Kerah Formal', description: 'Kemeja lengan panjang berkerah kaku profesional' },
  { id: 'rolled-sleeves', name: 'Kemeja Lengan Digulung', description: 'Kemeja dengan lengan digulung rapi khas pekerja aktif' },
  { id: 'casual-polo', name: 'Polo Shirt Bordir', description: 'Polo shirt kasual rapi untuk hari Jumat' },
  { id: 'cardigan-knit', name: 'Rajut Cardigan Hangat', description: 'Cardigan rajut nyaman di ruang ber-AC' },
  { id: 'crew-tshirt', name: 'Kaos Polos Minimalis', description: 'Kaos dalaman modern gaya tech startup' },
];

export const SUIT_OPTIONS: SelectOption[] = [
  { id: 'none', name: 'Tanpa Jas / Blazer', description: 'Hanya mengenakan kemeja atasan' },
  { id: 'single-breasted', name: 'Jas Formal Kancing Tunggal', description: 'Jas kantor standar eksekutif' },
  { id: 'smart-blazer', name: 'Blazer Kerja Kasual', description: 'Blazer terbuka santai namun tetap profesional' },
  { id: 'formal-vest', name: 'Rompi Jas (Suit Vest)', description: 'Rompi fitted gaya klasik arsitek' },
];

export const TIE_OPTIONS: SelectOption[] = [
  { id: 'none', name: 'Tanpa Dasi (Kerah Terbuka)', description: 'Tampilan santai tanpa dasi' },
  { id: 'necktie-silk', name: 'Dasi Sutra Panjang', description: 'Dasi panjang formal simpul Windsor' },
  { id: 'bowtie', name: 'Dasi Kupu-Kupu (Bowtie)', description: 'Dasi kupu-kupu unik dan karismatik' },
  { id: 'striped-tie', name: 'Dasi Garis Diagonal', description: 'Dasi motif garis korporat klasik' },
];

export const PANTS_OPTIONS: SelectOption[] = [
  { id: 'slacks-formal', name: 'Celana Bahan Formal (Slacks)', description: 'Celana kain lipatan tajam profesional' },
  { id: 'chinos-neat', name: 'Celana Chino Rapi', description: 'Celana katun semi-formal modern' },
  { id: 'pencil-skirt', name: 'Rok Pensil Kerja (Pencil Skirt)', description: 'Rok span selutut formal wanita kantoran' },
  { id: 'a-line-skirt', name: 'Rok A-Line Panjang', description: 'Rok kerja anggun longgar nyaman' },
  { id: 'dark-jeans', name: 'Jeans Gelap Rapi', description: 'Celana denim pekat tanpa sobekan untuk tech worker' },
];

export const SHOES_OPTIONS: SelectOption[] = [
  { id: 'oxford-leather', name: 'Sepatu Pantofel Oxford', description: 'Sepatu kulit formal bertali elegan' },
  { id: 'penny-loafers', name: 'Loafers Kulit Selop', description: 'Sepatu selop praktis berkelas' },
  { id: 'flats-shoes', name: 'Sepatu Flat Kerja', description: 'Sepatu sol tipis feminin nyaman sepanjang hari' },
  { id: 'clean-sneakers', name: 'Sneakers Kanvas Minimalis', description: 'Sepatu kets rapi ala industri kreatif' },
  { id: 'work-boots', name: 'Sepatu Bot Kerja Kulit', description: 'Bot kulit kokoh untuk mobilitas tinggi' },
];

export const ACCESSORIES_OPTIONS: SelectOption[] = [
  { id: 'id-badge', name: 'Tali Lanyard ID Card Kantor', description: 'Tanda pengenal karyawan tergantung di leher' },
  { id: 'leather-watch', name: 'Jam Tangan Kulit Mewah', description: 'Aksesoris penunjuk waktu di pergelangan tangan' },
  { id: 'briefcase', name: 'Tas Berkas / Laptop Case', description: 'Membawa map dokumen penting di tangan' },
  { id: 'none', name: 'Tanpa Aksesoris Tambahan', description: 'Tampilan bersih tanpa hiasan ekstra' },
];

// ---------------------------------------------------------------------------
// 3. Default Presets (Inspirasi Cepat Gaya Kantor)
// ---------------------------------------------------------------------------

export const DEFAULT_CHARACTER: CharacterCustomization = {
  name: 'Baginda Putra Krista',
  gender: 'male',
  bodyType: 'standard',
  skinTone: 'peach',
  hairStyle: 'short-parted',
  hairColor: 'black',
  eyeColor: 'dark-brown',
  facialHair: 'none',
  glasses: 'none',
  shirtType: 'collared-formal',
  shirtColor: 'white',
  suitType: 'none',
  suitColor: 'navy-suit',
  tieType: 'none',
  tieColor: 'crimson',
  pantsType: 'slacks-formal',
  pantsColor: 'charcoal',
  shoesType: 'oxford-leather',
  shoesColor: 'black-leather',
  accessory: 'id-badge',
};

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'executive',
    name: 'Eksekutif / Atasan Formal',
    description: 'Setelan jas navy lengkap dengan kemeja putih dan dasi merah marun berwibawa.',
    config: {
      ...DEFAULT_CHARACTER,
      hairStyle: 'slicked-back',
      hairColor: 'black',
      shirtType: 'collared-formal',
      shirtColor: 'white',
      suitType: 'single-breasted',
      suitColor: 'navy-suit',
      tieType: 'necktie-silk',
      tieColor: 'crimson',
      pantsType: 'slacks-formal',
      pantsColor: 'navy',
      shoesType: 'oxford-leather',
      shoesColor: 'black-leather',
      glasses: 'horn-rimmed',
      accessory: 'leather-watch',
    },
  },
  {
    id: 'onboarding',
    name: 'Karyawan Baru (Smart Casual)',
    description: 'Kemeja biru muda dengan lengan digulung, celana chino, dan tali lanyard ID kantor.',
    config: {
      ...DEFAULT_CHARACTER,
      hairStyle: 'short-parted',
      hairColor: 'dark-brown',
      shirtType: 'rolled-sleeves',
      shirtColor: 'sky-blue',
      suitType: 'none',
      suitColor: 'charcoal-suit',
      tieType: 'none',
      tieColor: 'deep-navy',
      pantsType: 'chinos-neat',
      pantsColor: 'khaki',
      shoesType: 'penny-loafers',
      shoesColor: 'dark-brown',
      glasses: 'wire-frame',
      accessory: 'id-badge',
    },
  },
  {
    id: 'tech-dev',
    name: 'Developer / Tim IT',
    description: 'Polo shirt slate teal kasual dengan celana denim gelap dan sneakers minimalis.',
    config: {
      ...DEFAULT_CHARACTER,
      hairStyle: 'messy-crop',
      hairColor: 'caramel',
      shirtType: 'casual-polo',
      shirtColor: 'slate-teal',
      suitType: 'none',
      suitColor: 'black-suit',
      tieType: 'none',
      tieColor: 'black',
      pantsType: 'dark-jeans',
      pantsColor: 'dark-denim',
      shoesType: 'clean-sneakers',
      shoesColor: 'white-sneaker',
      glasses: 'reading-oval',
      accessory: 'id-badge',
    },
  },
  {
    id: 'lady-office',
    name: 'Staff Profesional Wanita',
    description: 'Kemeja rapi dengan blazer santai, rok pensil kerja, dan sanggul rambut elegan.',
    config: {
      ...DEFAULT_CHARACTER,
      gender: 'female',
      skinTone: 'peach',
      hairStyle: 'office-bun',
      hairColor: 'dark-brown',
      shirtType: 'collared-formal',
      shirtColor: 'white',
      suitType: 'smart-blazer',
      suitColor: 'charcoal-suit',
      tieType: 'none',
      tieColor: 'gold',
      pantsType: 'pencil-skirt',
      pantsColor: 'charcoal',
      shoesType: 'flats-shoes',
      shoesColor: 'black-leather',
      glasses: 'none',
      accessory: 'id-badge',
    },
  },
];

