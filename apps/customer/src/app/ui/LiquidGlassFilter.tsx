export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      className="customer-glass-filter"
      focusable="false"
      height="0"
      width="0"
    >
      <defs>
        <filter id="liquid-glass-distortion">
          <feTurbulence
            baseFrequency="0.018 0.026"
            numOctaves="2"
            result="noise"
            seed="9"
            type="fractalNoise"
          />
          <feGaussianBlur in="noise" result="softNoise" stdDeviation="0.6" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
