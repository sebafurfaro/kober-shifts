export default function Logo({ width = 100, height = 110 }: { width?: number, height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 610 610" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="17" y="17" width="575" height="575" rx="45" fill="url(#paint0_linear_13_24)"/>
<path d="M110 122.917C110 106.349 123.431 92.9173 140 92.9173H244.845V487.634C244.845 504.202 231.414 517.634 214.845 517.634H110V122.917Z" fill="white"/>
<path d="M498.024 486.716C498.024 503.285 484.592 516.716 468.024 516.716L363.179 516.716L363.179 122C363.179 105.432 376.61 92 393.179 92L498.024 92L498.024 486.716Z" fill="white"/>
<path d="M363.054 516.716L458.301 461.293L244.691 94.203L149.445 149.627L363.054 516.716Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_13_24" x1="49.5" y1="592" x2="592" y2="44" gradientUnits="userSpaceOnUse">
<stop stopColor="#1A237E"/>
<stop offset="0.5" stopColor="#1497B6"/>
<stop offset="1" stopColor="#26A69A"/>
</linearGradient>
</defs>
</svg>
  );
}