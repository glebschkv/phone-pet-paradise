/**
 * Pixel-art style SVG icons for Lucky Wheel prizes.
 * Replaces Unicode emojis with consistent, themed graphics.
 */

interface WheelPrizeIconProps {
  prizeId: string;
  size?: number;
  className?: string;
}

export const WheelPrizeIcon = ({ prizeId, size = 24, className = '' }: WheelPrizeIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      {getIconPaths(prizeId)}
    </svg>
  );
};

/**
 * For rendering inside the wheel SVG via <foreignObject>.
 * Returns just the raw SVG content without a wrapper.
 */
export const WheelPrizeIconSVG = ({ prizeId, size = 16 }: { prizeId: string; size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
    >
      {getIconPaths(prizeId)}
    </svg>
  );
};

function getIconPaths(prizeId: string) {
  switch (prizeId) {
    case 'coins-100':
      return <CoinIcon />;
    case 'coins-200':
      return <CoinBagIcon />;
    case 'xp-50':
      return <StarIcon />;
    case 'xp-100':
      return <SparkleStarIcon />;
    case 'coins-500':
      return <GemIcon />;
    case 'streak-freeze':
      return <IceIcon />;
    case 'booster':
      return <RocketIcon />;
    case 'mystery-box':
      return <GiftBoxIcon />;
    case 'jackpot':
      return <JackpotIcon />;
    default:
      return <StarIcon />;
  }
}

/* ── Single Coin ── */
function CoinIcon() {
  return (
    <g>
      {/* Coin body */}
      <rect x="4" y="3" width="8" height="10" rx="0" fill="#fbbf24" />
      <rect x="3" y="4" width="10" height="8" fill="#fbbf24" />
      {/* Highlight */}
      <rect x="4" y="4" width="8" height="1" fill="#fde68a" />
      <rect x="4" y="4" width="1" height="7" fill="#fde68a" />
      {/* Shadow */}
      <rect x="4" y="11" width="8" height="1" fill="#d97706" />
      <rect x="11" y="5" width="1" height="6" fill="#d97706" />
      {/* Inner circle detail */}
      <rect x="6" y="5" width="4" height="1" fill="#d97706" />
      <rect x="6" y="10" width="4" height="1" fill="#d97706" />
      <rect x="5" y="6" width="1" height="4" fill="#d97706" />
      <rect x="10" y="6" width="1" height="4" fill="#d97706" />
      {/* $ symbol */}
      <rect x="7" y="6" width="2" height="1" fill="#d97706" />
      <rect x="7" y="8" width="2" height="1" fill="#d97706" />
      <rect x="7" y="7" width="1" height="1" fill="#d97706" />
      <rect x="8" y="9" width="1" height="1" fill="#d97706" />
    </g>
  );
}

/* ── Coin Bag ── */
function CoinBagIcon() {
  return (
    <g>
      {/* Bag body */}
      <rect x="3" y="7" width="10" height="7" fill="#d97706" />
      <rect x="4" y="6" width="8" height="1" fill="#d97706" />
      <rect x="5" y="14" width="6" height="1" fill="#b45309" />
      {/* Bag highlight */}
      <rect x="4" y="7" width="1" height="6" fill="#fbbf24" />
      <rect x="4" y="7" width="4" height="1" fill="#fbbf24" />
      {/* Bag shadow */}
      <rect x="11" y="8" width="1" height="5" fill="#92400e" />
      <rect x="5" y="13" width="6" height="1" fill="#92400e" />
      {/* Tie */}
      <rect x="6" y="4" width="4" height="2" fill="#b45309" />
      <rect x="7" y="3" width="2" height="1" fill="#b45309" />
      {/* $ on bag */}
      <rect x="7" y="8" width="2" height="1" fill="#fbbf24" />
      <rect x="7" y="10" width="2" height="1" fill="#fbbf24" />
      <rect x="7" y="9" width="1" height="1" fill="#fbbf24" />
      <rect x="8" y="11" width="1" height="1" fill="#fbbf24" />
    </g>
  );
}

/* ── Star (XP) ── */
function StarIcon() {
  return (
    <g>
      {/* Star shape - 5 pointed */}
      <rect x="7" y="1" width="2" height="2" fill="#fde047" />
      <rect x="6" y="3" width="4" height="1" fill="#fde047" />
      <rect x="5" y="4" width="6" height="1" fill="#fde047" />
      <rect x="3" y="5" width="10" height="2" fill="#fde047" />
      <rect x="4" y="7" width="8" height="1" fill="#fde047" />
      <rect x="5" y="8" width="6" height="1" fill="#fde047" />
      <rect x="4" y="9" width="3" height="1" fill="#fde047" />
      <rect x="9" y="9" width="3" height="1" fill="#fde047" />
      <rect x="3" y="10" width="3" height="2" fill="#fde047" />
      <rect x="10" y="10" width="3" height="2" fill="#fde047" />
      <rect x="2" y="12" width="2" height="1" fill="#fde047" />
      <rect x="12" y="12" width="2" height="1" fill="#fde047" />
      {/* Highlight */}
      <rect x="7" y="2" width="1" height="1" fill="#fef9c3" />
      <rect x="6" y="5" width="1" height="2" fill="#fef9c3" />
      {/* Shadow */}
      <rect x="8" y="7" width="3" height="1" fill="#eab308" />
      <rect x="10" y="9" width="2" height="2" fill="#eab308" />
    </g>
  );
}

/* ── Sparkle Star (XP 100) ── */
function SparkleStarIcon() {
  return (
    <g>
      {/* Main star */}
      <rect x="7" y="2" width="2" height="2" fill="#c084fc" />
      <rect x="6" y="4" width="4" height="1" fill="#c084fc" />
      <rect x="4" y="5" width="8" height="2" fill="#c084fc" />
      <rect x="5" y="7" width="6" height="1" fill="#c084fc" />
      <rect x="4" y="8" width="3" height="1" fill="#c084fc" />
      <rect x="9" y="8" width="3" height="1" fill="#c084fc" />
      <rect x="3" y="9" width="3" height="2" fill="#c084fc" />
      <rect x="10" y="9" width="3" height="2" fill="#c084fc" />
      <rect x="2" y="11" width="2" height="1" fill="#c084fc" />
      <rect x="12" y="11" width="2" height="1" fill="#c084fc" />
      {/* Highlight */}
      <rect x="7" y="3" width="1" height="1" fill="#e9d5ff" />
      <rect x="5" y="5" width="1" height="2" fill="#e9d5ff" />
      {/* Sparkle dots */}
      <rect x="1" y="2" width="1" height="1" fill="#fde047" />
      <rect x="14" y="1" width="1" height="1" fill="#fde047" />
      <rect x="13" y="4" width="1" height="1" fill="#fde047" />
      <rect x="1" y="7" width="1" height="1" fill="#fde047" />
    </g>
  );
}

/* ── Gem / Diamond ── */
function GemIcon() {
  return (
    <g>
      {/* Top facet */}
      <rect x="4" y="3" width="8" height="3" fill="#38bdf8" />
      <rect x="3" y="4" width="1" height="2" fill="#38bdf8" />
      <rect x="12" y="4" width="1" height="2" fill="#38bdf8" />
      {/* Top highlight */}
      <rect x="5" y="3" width="3" height="1" fill="#bae6fd" />
      <rect x="4" y="4" width="2" height="1" fill="#bae6fd" />
      {/* Bottom facets */}
      <rect x="4" y="6" width="8" height="2" fill="#0ea5e9" />
      <rect x="5" y="8" width="6" height="2" fill="#0284c7" />
      <rect x="6" y="10" width="4" height="2" fill="#0369a1" />
      <rect x="7" y="12" width="2" height="1" fill="#075985" />
      {/* Center line */}
      <rect x="7" y="6" width="2" height="6" fill="#38bdf8" />
      {/* Sparkle */}
      <rect x="5" y="5" width="1" height="1" fill="#f0f9ff" />
    </g>
  );
}

/* ── Ice Cube (Streak Freeze) ── */
function IceIcon() {
  return (
    <g>
      {/* Ice block */}
      <rect x="3" y="4" width="10" height="9" fill="#67e8f9" />
      <rect x="4" y="3" width="8" height="1" fill="#67e8f9" />
      <rect x="4" y="13" width="8" height="1" fill="#22d3ee" />
      {/* Highlight */}
      <rect x="4" y="4" width="4" height="1" fill="#ecfeff" />
      <rect x="4" y="4" width="1" height="4" fill="#cffafe" />
      <rect x="5" y="5" width="2" height="2" fill="#ecfeff" />
      {/* Shadow */}
      <rect x="11" y="5" width="1" height="7" fill="#06b6d4" />
      <rect x="5" y="12" width="6" height="1" fill="#06b6d4" />
      {/* Inner crack */}
      <rect x="7" y="7" width="1" height="1" fill="#cffafe" />
      <rect x="8" y="8" width="1" height="1" fill="#cffafe" />
      <rect x="9" y="9" width="1" height="1" fill="#cffafe" />
      {/* Snowflake dot */}
      <rect x="1" y="2" width="1" height="1" fill="#a5f3fc" />
      <rect x="13" y="6" width="1" height="1" fill="#a5f3fc" />
    </g>
  );
}

/* ── Rocket (Booster) ── */
function RocketIcon() {
  return (
    <g>
      {/* Nose */}
      <rect x="7" y="1" width="2" height="2" fill="#f87171" />
      {/* Body */}
      <rect x="6" y="3" width="4" height="6" fill="#e2e8f0" />
      <rect x="5" y="5" width="1" height="4" fill="#e2e8f0" />
      <rect x="10" y="5" width="1" height="4" fill="#cbd5e1" />
      {/* Highlight */}
      <rect x="6" y="3" width="1" height="5" fill="#f8fafc" />
      {/* Window */}
      <rect x="7" y="4" width="2" height="2" fill="#38bdf8" />
      <rect x="7" y="4" width="1" height="1" fill="#bae6fd" />
      {/* Fins */}
      <rect x="4" y="8" width="1" height="3" fill="#f87171" />
      <rect x="3" y="9" width="1" height="2" fill="#f87171" />
      <rect x="11" y="8" width="1" height="3" fill="#ef4444" />
      <rect x="12" y="9" width="1" height="2" fill="#ef4444" />
      {/* Exhaust */}
      <rect x="6" y="9" width="4" height="1" fill="#94a3b8" />
      <rect x="7" y="10" width="2" height="1" fill="#fbbf24" />
      <rect x="6" y="11" width="4" height="1" fill="#f97316" />
      <rect x="7" y="12" width="2" height="2" fill="#fbbf24" />
      <rect x="7" y="14" width="1" height="1" fill="#fde047" />
    </g>
  );
}

/* ── Gift Box (Mystery Box) ── */
function GiftBoxIcon() {
  return (
    <g>
      {/* Lid */}
      <rect x="2" y="4" width="12" height="3" fill="#f59e0b" />
      <rect x="3" y="3" width="10" height="1" fill="#f59e0b" />
      {/* Lid highlight */}
      <rect x="3" y="4" width="4" height="1" fill="#fcd34d" />
      {/* Box body */}
      <rect x="3" y="7" width="10" height="6" fill="#d97706" />
      <rect x="4" y="13" width="8" height="1" fill="#b45309" />
      {/* Body highlight */}
      <rect x="3" y="7" width="1" height="5" fill="#f59e0b" />
      {/* Ribbon vertical */}
      <rect x="7" y="3" width="2" height="11" fill="#ef4444" />
      {/* Ribbon horizontal */}
      <rect x="3" y="5" width="10" height="1" fill="#ef4444" />
      {/* Bow */}
      <rect x="5" y="1" width="2" height="2" fill="#ef4444" />
      <rect x="9" y="1" width="2" height="2" fill="#ef4444" />
      <rect x="7" y="2" width="2" height="1" fill="#f87171" />
      {/* Ribbon highlight */}
      <rect x="7" y="3" width="1" height="1" fill="#f87171" />
    </g>
  );
}

/* ── Jackpot (Slot Machine) ── */
function JackpotIcon() {
  return (
    <g>
      {/* Machine body */}
      <rect x="2" y="3" width="12" height="11" fill="#ef4444" />
      <rect x="3" y="2" width="10" height="1" fill="#ef4444" />
      <rect x="3" y="14" width="10" height="1" fill="#b91c1c" />
      {/* Highlight */}
      <rect x="3" y="3" width="1" height="9" fill="#f87171" />
      <rect x="3" y="3" width="9" height="1" fill="#f87171" />
      {/* Shadow */}
      <rect x="12" y="4" width="1" height="9" fill="#991b1b" />
      {/* Screen */}
      <rect x="4" y="5" width="8" height="5" fill="#1e1b4b" />
      {/* Screen slots */}
      <rect x="4" y="5" width="2" height="5" fill="#fbbf24" />
      <rect x="7" y="5" width="2" height="5" fill="#fbbf24" />
      <rect x="10" y="5" width="2" height="5" fill="#fbbf24" />
      {/* 7s on slots */}
      <rect x="4" y="6" width="2" height="1" fill="#ef4444" />
      <rect x="5" y="7" width="1" height="1" fill="#ef4444" />
      <rect x="4" y="8" width="2" height="1" fill="#ef4444" />
      <rect x="7" y="6" width="2" height="1" fill="#ef4444" />
      <rect x="8" y="7" width="1" height="1" fill="#ef4444" />
      <rect x="7" y="8" width="2" height="1" fill="#ef4444" />
      <rect x="10" y="6" width="2" height="1" fill="#ef4444" />
      <rect x="11" y="7" width="1" height="1" fill="#ef4444" />
      <rect x="10" y="8" width="2" height="1" fill="#ef4444" />
      {/* Lever */}
      <rect x="14" y="4" width="1" height="4" fill="#94a3b8" />
      <rect x="14" y="3" width="2" height="2" fill="#f87171" />
      {/* Top label */}
      <rect x="5" y="3" width="1" height="1" fill="#fbbf24" />
      <rect x="7" y="3" width="2" height="1" fill="#fbbf24" />
      <rect x="10" y="3" width="1" height="1" fill="#fbbf24" />
      {/* Bottom tray */}
      <rect x="5" y="11" width="6" height="2" fill="#1e1b4b" />
      <rect x="6" y="11" width="4" height="1" fill="#fbbf24" />
    </g>
  );
}
