'use client';

/**
 * Body Shape SVGs — 5 minimalist silhouettes used by BodyAvatar.
 *
 * Each silhouette is a single-color symbol that uses `currentColor`, so the
 * parent component can recolor it via CSS (gradient, level tier, etc).
 *
 * Anatomy: front-view, viewBox 100x180 (~human proportions). Same head/leg
 * geometry across shapes — only shoulders, torso width and arm thickness
 * differ. This keeps the crossfade visually coherent.
 */

import type { SVGProps } from 'react';
import type { BodyShape } from '../../domain/body-shape';

type Props = SVGProps<SVGSVGElement>;

const BASE: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 100 180',
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'currentColor',
  'aria-hidden': true,
};

/** Magro — narrow shoulders, thin torso. */
export function BodyShapeMagro(props: Props) {
  return (
    <svg {...BASE} {...props}>
      {/* Head */}
      <circle cx="50" cy="20" r="11" />
      {/* Neck */}
      <rect x="46" y="29" width="8" height="6" />
      {/* Shoulders + torso (narrow trapezoid → rectangle) */}
      <path d="M37 36 Q50 33 63 36 L62 62 Q50 65 38 62 Z" />
      {/* Arms */}
      <rect x="32" y="38" width="6" height="48" rx="3" />
      <rect x="62" y="38" width="6" height="48" rx="3" />
      {/* Waist */}
      <path d="M38 62 Q50 64 62 62 L60 92 Q50 94 40 92 Z" />
      {/* Legs */}
      <rect x="40" y="92" width="9" height="72" rx="4" />
      <rect x="51" y="92" width="9" height="72" rx="4" />
    </svg>
  );
}

/** Fit — balanced proportions, slightly defined torso. */
export function BodyShapeFit(props: Props) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="50" cy="20" r="11" />
      <rect x="46" y="29" width="8" height="6" />
      {/* Shoulders wider + V-taper */}
      <path d="M33 36 Q50 32 67 36 L64 64 Q50 68 36 64 Z" />
      <rect x="28" y="38" width="7" height="50" rx="3.5" />
      <rect x="65" y="38" width="7" height="50" rx="3.5" />
      <path d="M36 64 Q50 67 64 64 L60 94 Q50 96 40 94 Z" />
      <rect x="40" y="94" width="9" height="70" rx="4" />
      <rect x="51" y="94" width="9" height="70" rx="4" />
    </svg>
  );
}

/** Atletico — broad shoulders, lean waist, sculpted arms. */
export function BodyShapeAtletico(props: Props) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="50" cy="20" r="11.5" />
      <rect x="46" y="29" width="8" height="6" />
      {/* Strong V-taper: broad shoulders → narrow waist */}
      <path d="M28 38 Q50 30 72 38 L65 66 Q50 70 35 66 Z" />
      <rect x="23" y="40" width="8" height="52" rx="4" />
      <rect x="69" y="40" width="8" height="52" rx="4" />
      <path d="M35 66 Q50 70 65 66 L60 96 Q50 98 40 96 Z" />
      <rect x="40" y="96" width="9.5" height="68" rx="4" />
      <rect x="50.5" y="96" width="9.5" height="68" rx="4" />
    </svg>
  );
}

/** Forte — very broad shoulders, thick arms, dense chest. */
export function BodyShapeForte(props: Props) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="50" cy="20" r="12" />
      <rect x="45" y="30" width="10" height="5" />
      {/* Massive shoulders + thick torso */}
      <path d="M22 40 Q50 28 78 40 L68 68 Q50 72 32 68 Z" />
      {/* Thick arms */}
      <rect x="16" y="42" width="10" height="54" rx="5" />
      <rect x="74" y="42" width="10" height="54" rx="5" />
      <path d="M32 68 Q50 72 68 68 L62 98 Q50 100 38 98 Z" />
      <rect x="39" y="98" width="10.5" height="66" rx="5" />
      <rect x="50.5" y="98" width="10.5" height="66" rx="5" />
    </svg>
  );
}

/** Volumoso — broad shoulders + thick midsection. */
export function BodyShapeVolumoso(props: Props) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="50" cy="20" r="12.5" />
      <rect x="45" y="30" width="10" height="5" />
      {/* Wide rectangle — torso is broad top AND bottom */}
      <path d="M24 40 Q50 32 76 40 L78 72 Q50 78 22 72 Z" />
      <rect x="17" y="42" width="10" height="56" rx="5" />
      <rect x="73" y="42" width="10" height="56" rx="5" />
      {/* Belly (wider waist) */}
      <path d="M22 72 Q50 80 78 72 L70 102 Q50 106 30 102 Z" />
      <rect x="38" y="102" width="11" height="62" rx="5" />
      <rect x="51" y="102" width="11" height="62" rx="5" />
    </svg>
  );
}

const SHAPE_MAP: Record<BodyShape, (p: Props) => React.ReactElement> = {
  magro: BodyShapeMagro,
  fit: BodyShapeFit,
  atletico: BodyShapeAtletico,
  forte: BodyShapeForte,
  volumoso: BodyShapeVolumoso,
};

export function BodyShapeSVG({ shape, ...rest }: Props & { shape: BodyShape }) {
  const Component = SHAPE_MAP[shape];
  return <Component {...rest} />;
}
