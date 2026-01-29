import { memo } from 'react';

/**
 * Color palette for pixel art icons.
 * Single-character keys map to hex colors.
 */
const PALETTE: Record<string, string> = {
  Y: '#FFD700', // gold
  A: '#FFC107', // amber
  O: '#FF8C00', // dark orange
  F: '#FF6B35', // flame
  R: '#EF4444', // red
  M: '#EC4899', // pink
  B: '#3B82F6', // blue
  L: '#93C5FD', // light blue
  C: '#22D3EE', // cyan
  T: '#14B8A6', // teal
  G: '#22C55E', // green
  E: '#16A34A', // dark green
  W: '#F8FAFC', // white
  S: '#94A3B8', // silver
  K: '#334155', // dark
  N: '#92400E', // brown
  D: '#78350F', // dark brown
  P: '#A855F7', // purple
  V: '#8B5CF6', // violet
  I: '#818CF8', // indigo
};

/**
 * 8x8 pixel art icon grids.
 * '.' = transparent pixel, letter = color from PALETTE.
 */
const ICONS: Record<string, string[]> = {
  // ---- Category tab icons ----
  star: [
    '....Y...',
    '...YAY..',
    '..YAAAY.',
    'YAAAAAAY',
    'YAAAAAAY',
    '..YAAAY.',
    '.YA..AY.',
    'Y......Y',
  ],
  paw: [
    '.N...N..',
    'NNN.NNN.',
    '.N...N..',
    '........',
    '..NNNN..',
    '.NNNNNN.',
    '.NNNNNN.',
    '..NNNN..',
  ],
  gift: [
    '..RRRR..',
    '.RRRRRR.',
    'RRYRRYRR',
    'YYYYYYYY',
    'RRYRRYRR',
    'RRYRRYRR',
    'RRYRRYRR',
    'RRRRRRRR',
  ],
  lightning: [
    '.....YY.',
    '....YY..',
    '...YY...',
    'YYYYYY..',
    '..YYYY..',
    '..YY....',
    '.YY.....',
    'YY......',
  ],

  // ---- Booster / power-up icons ----
  rocket: [
    '...SS...',
    '..SBBW..',
    '..SBBW..',
    '.WBBBBW.',
    'RWBBBBWR',
    'RWWBBWWR',
    '..RFRF..',
    '...FF...',
  ],
  calendar: [
    '.KK..KK.',
    'RRRRRRRR',
    'RRRRRRRR',
    'WWWWWWWW',
    'WKWWWKWW',
    'WWWWWWWW',
    'WWKWKWWW',
    'WWWWWWWW',
  ],

  // ---- Coin pack icons ----
  coin: [
    '..YYYY..',
    '.YAAAAY.',
    'YAAYAAAY',
    'YAAAYAAY',
    'YAAAYAAY',
    'YAAYAAAY',
    '.YAAAAY.',
    '..YYYY..',
  ],
  'money-bag': [
    '...AA...',
    '..AAAA..',
    '.NNNNNN.',
    'NNNYNNNN',
    'NNYYYYNN',
    'NNNYNNNN',
    '.NNNNNN.',
    '..NNNN..',
  ],
  diamond: [
    '...LL...',
    '..BLLB..',
    '.BLLLLB.',
    'BLLLLLLB',
    '.BLLLLB.',
    '..BLLB..',
    '...BB...',
    '........',
  ],
  trophy: [
    'YAAAAAAY',
    'YAAAAAAY',
    '.YAAAAY.',
    '..YAAY..',
    '...YY...',
    '...YY...',
    '..YYYY..',
    '..YYYY..',
  ],

  // ---- Utility icons ----
  'ice-cube': [
    '..CCCC..',
    '.CLLLCC.',
    'CLWLLCC.',
    'CLLLLCC.',
    'CCLLCCC.',
    '.CCCCCC.',
    '..CCCC..',
    '........',
  ],

  // ---- Bundle icons ----
  sparkles: [
    '...V....',
    '..VPV...',
    '.VPPPV..',
    '..VPV...',
    '...V....',
    '......V.',
    '.....VPV',
    '......V.',
  ],
  moon: [
    '...AAA..',
    '..AAAA..',
    '.AAAA...',
    '.AAAA...',
    '.AAAA...',
    '.AAAA...',
    '..AAAA..',
    '...AAA..',
  ],
  masks: [
    '..AAAA..',
    '.AAAAAA.',
    'AK.AA.KA',
    'AAAAAAAA',
    'AAA..AAA',
    '.AAAAAA.',
    '..AAAA..',
    '........',
  ],
  leaf: [
    '.....GGG',
    '...GGEGG',
    '..GGEGG.',
    '.GGEGG..',
    'GGEGGGG.',
    'GGGGGG..',
    '.GGGG...',
    '..N.....',
  ],
  crown: [
    'Y..Y..Y.',
    'YY.Y.YY.',
    'YYYYYYY.',
    'YRBYRBY.',
    'YYYYYYY.',
    '.YYYYY..',
    '........',
    '........',
  ],
  'sun-cloud': [
    '.....Y..',
    '..Y.YAY.',
    '...YAAY.',
    '..YAYY..',
    '...WWWW.',
    '.WWWWWWW',
    'WWWWWWWW',
    '.WWWWWW.',
  ],

  // ---- Background theme icons ----
  island: [
    '...GG...',
    '..GGGG..',
    '...GG...',
    '...NN...',
    '...NN...',
    '.EEEEEE.',
    'AAAAAAAA',
    '..BBBB..',
  ],
  wave: [
    '........',
    '...B....',
    '..BBB.B.',
    '.BBBBBBB',
    'BLBBLBBB',
    'LLBBLLBL',
    'LLLLLLLL',
    '.LLLLLL.',
  ],
  cloud: [
    '........',
    '..WWW...',
    '.WWWWW..',
    'WWWWWWW.',
    'WWWWWWWW',
    'WWWWWWWW',
    '.SSSSSS.',
    '........',
  ],
  sunset: [
    '...FF...',
    '..FOOF..',
    '.FOOOFO.',
    'OOOOOOOO',
    'RRRRRRRR',
    'MRRRRRRM',
    'MMMMMMMM',
    'PPPPPPPP',
  ],
  sakura: [
    '...M....',
    '..MMMM..',
    '.MMWMMM.',
    '.MMMMM..',
    '..MMM...',
    '..EE....',
    '.EE.E...',
    'E.......',
  ],
  'neon-city': [
    '.K...KK.',
    '.K.P.KK.',
    '.K.P.KKK',
    'KK.P.KBK',
    'KKPK.KBK',
    'KKPKKBBK',
    'KKPKKBKK',
    'KKKKKKKK',
  ],
  aurora: [
    'G.P.B.G.',
    '.G.P.B.G',
    'G.G.P.B.',
    '.G.G.P..',
    '........',
    '...WW...',
    '..WWWW..',
    '.WWWWWW.',
  ],
  volcano: [
    '...RF...',
    '..RRFF..',
    '..NNNN..',
    '.NNNNNN.',
    '.NNNNNN.',
    'NNNNNNNN',
    'NNNNNNNN',
    'EEEEEEEE',
  ],
  fish: [
    '........',
    '..TTTT..',
    'TT.TWTT.',
    'TTTTTTTT',
    'TT.TTTTT',
    '..TTTT..',
    '........',
    '........',
  ],
  pumpkin: [
    '...EE...',
    '..OOOO..',
    '.OOOOOO.',
    'OOKOKOOO',
    'OOOOOOOO',
    'OOK..KOO',
    '.OOOOOO.',
    '..OOOO..',
  ],
  'christmas-tree': [
    '...EE...',
    '..EEEE..',
    '..EREG..',
    '.EEEEEE.',
    '.EGYEGE.',
    'EEEEEEEE',
    '...NN...',
    '...NN...',
  ],

  // ---- Section header icons ----
  'picture-frame': [
    'NNNNNNNN',
    'NLLLLLLN',
    'NLLLLLLN',
    'NGGGEEGN',
    'NGGEEGEN',
    'NBBLBBNN',
    'NBBBBBBN',
    'NNNNNNNN',
  ],
  backpack: [
    '..SSSS..',
    '.NNNNNN.',
    'NNNNNNNN',
    'NNAAAANN',
    'NNAAAANN',
    'NNNNNNNN',
    'NNNNNNNN',
    '.NNNNNN.',
  ],
  fire: [
    '...Y....',
    '..YY.Y..',
    '..YAY...',
    '.YAAY...',
    '.YAAOY..',
    'YOAAOY..',
    'YOOOOY..',
    '.RRRR...',
  ],
  potion: [
    '..SSSS..',
    '...SS...',
    '..SSSS..',
    '.PPPPPP.',
    'PVPPPPVP',
    'PPPPPPPP',
    'PPVPPVPP',
    '.PPPPPP.',
  ],
};

interface PixelIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a hand-crafted 8x8 pixel art icon as an SVG.
 * Uses `crispEdges` rendering for a sharp, retro pixel look.
 */
export const PixelIcon = memo(function PixelIcon({ name, size = 24, className }: PixelIconProps) {
  const grid = ICONS[name];
  if (!grid) {
    return <span className={className} style={{ fontSize: size * 0.6, lineHeight: 1 }}>{name}</span>;
  }

  const gridSize = grid.length;
  const rects: JSX.Element[] = [];

  for (let y = 0; y < gridSize; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char === '.') continue;
      const color = PALETTE[char];
      if (!color) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
      );
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid[0].length} ${gridSize}`}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      shapeRendering="crispEdges"
      role="img"
      aria-label={name}
    >
      {rects}
    </svg>
  );
});
