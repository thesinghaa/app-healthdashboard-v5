import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function AuroraBackground() {
  const wrapRef = useRef(null);
  const turbRef = useRef(null);
  const dispRef = useRef(null);

  useEffect(() => {
    const turb = turbRef.current;
    const disp = dispRef.current;
    if (!turb || !disp) return;

    const ctx = gsap.context(() => {

      /* 1. Seed — slow continuous morphing of turbulence shape */
      const seed = { val: 1 };
      gsap.to(seed, {
        val: 500, duration: 120, ease: 'none', repeat: -1,
        onUpdate() { turb.setAttribute('seed', Math.round(seed.val)); },
      });

      /* 2. Displacement scale — 12 waypoints, ~95s loop */
      const sc = { val: 80 };
      const su = () => disp.setAttribute('scale', sc.val.toFixed(1));
      gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } })
        .to(sc, { val: 185, duration: 12.0, onUpdate: su })
        .to(sc, { val: 38,  duration:  9.0, onUpdate: su })
        .to(sc, { val: 162, duration: 14.3, onUpdate: su })
        .to(sc, { val: 22,  duration:  8.3, onUpdate: su })
        .to(sc, { val: 175, duration: 12.8, onUpdate: su })
        .to(sc, { val: 50,  duration:  9.8, onUpdate: su })
        .to(sc, { val: 148, duration: 13.5, onUpdate: su })
        .to(sc, { val: 28,  duration:  8.7, onUpdate: su })
        .to(sc, { val: 168, duration: 15.0, onUpdate: su })
        .to(sc, { val: 42,  duration:  9.3, onUpdate: su })
        .to(sc, { val: 135, duration: 13.2, onUpdate: su })
        .to(sc, { val: 80,  duration: 11.3, onUpdate: su });

      /* 3. Frequency X and Y on fully independent timelines */
      const fX = { val: 0.008 };
      const fY = { val: 0.055 };
      const sf = () =>
        turb.setAttribute('baseFrequency', `${fX.val.toFixed(4)} ${fY.val.toFixed(4)}`);

      gsap.timeline({ repeat: -1, defaults: { ease: 'power1.inOut', onUpdate: sf } })
        .to(fX, { val: 0.016, duration: 27 })
        .to(fX, { val: 0.003, duration: 23 })
        .to(fX, { val: 0.015, duration: 32 })
        .to(fX, { val: 0.005, duration: 20 })
        .to(fX, { val: 0.013, duration: 29 })
        .to(fX, { val: 0.007, duration: 18 })
        .to(fX, { val: 0.011, duration: 26 })
        .to(fX, { val: 0.008, duration: 24 });

      gsap.timeline({ repeat: -1, defaults: { ease: 'power1.inOut', onUpdate: sf } })
        .to(fY, { val: 0.108, duration: 36 })
        .to(fY, { val: 0.022, duration: 27 })
        .to(fY, { val: 0.096, duration: 42 })
        .to(fY, { val: 0.030, duration: 24 })
        .to(fY, { val: 0.082, duration: 35 })
        .to(fY, { val: 0.038, duration: 21 })
        .to(fY, { val: 0.071, duration: 38 })
        .to(fY, { val: 0.055, duration: 26 });

      /* 4. Per-band: opacity + x/y drift — each band on its own slow path */
      const bands = [...wrapRef.current.querySelectorAll('.ab')];
      const r = gsap.utils.random;

      bands.forEach((band, i) => {
        const base = parseFloat(band.getAttribute('opacity') ?? 0.5);

        gsap.to(band, {
          opacity: r(base * 0.10, base * 1.20),
          duration: r(9, 21),
          ease: 'sine.inOut',
          repeat: -1, yoyo: true,
          delay: i * 1.8,
        });

        gsap.to(band, {
          y: r(-35, 35),
          duration: r(18, 42),
          ease: 'sine.inOut',
          repeat: -1, yoyo: true,
          delay: i * 2.7,
        });

        gsap.to(band, {
          x: r(-55, 55),
          duration: r(30, 68),
          ease: 'sine.inOut',
          repeat: -1, yoyo: true,
          delay: i * 3.6,
        });
      });

    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="aurora-wrap" ref={wrapRef} aria-hidden="true">
      <svg
        className="aurora-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <defs>
          <filter
            id="aurora-fx"
            x="-30%" y="-30%"
            width="160%" height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              ref={turbRef}
              type="turbulence"
              baseFrequency="0.008 0.055"
              numOctaves="4"
              seed="1"
              result="turb"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="turb"
              scale="80"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <linearGradient id="ag-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="12%"  stopColor="rgba(34,211,238,0.30)" />
            <stop offset="30%"  stopColor="rgba(56,189,248,0.82)" />
            <stop offset="50%"  stopColor="rgba(186,230,253,0.78)" />
            <stop offset="70%"  stopColor="rgba(34,211,238,0.55)" />
            <stop offset="88%"  stopColor="rgba(6,182,212,0.20)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          <linearGradient id="ag-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="15%"  stopColor="rgba(96,165,250,0.25)" />
            <stop offset="35%"  stopColor="rgba(59,130,246,0.75)" />
            <stop offset="55%"  stopColor="rgba(147,197,253,0.68)" />
            <stop offset="75%"  stopColor="rgba(37,99,235,0.42)" />
            <stop offset="90%"  stopColor="rgba(29,78,216,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          <linearGradient id="ag-c" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="18%"  stopColor="rgba(6,182,212,0.35)" />
            <stop offset="38%"  stopColor="rgba(34,211,238,0.80)" />
            <stop offset="58%"  stopColor="rgba(103,232,249,0.65)" />
            <stop offset="78%"  stopColor="rgba(8,145,178,0.30)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          <linearGradient id="ag-d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="20%"  stopColor="rgba(29,78,216,0.30)" />
            <stop offset="42%"  stopColor="rgba(37,99,235,0.70)" />
            <stop offset="62%"  stopColor="rgba(96,165,250,0.58)" />
            <stop offset="80%"  stopColor="rgba(30,64,175,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          <linearGradient id="ag-e" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="22%"  stopColor="rgba(186,230,253,0.22)" />
            <stop offset="45%"  stopColor="rgba(224,247,250,0.60)" />
            <stop offset="65%"  stopColor="rgba(147,197,253,0.45)" />
            <stop offset="85%"  stopColor="rgba(56,189,248,0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        <g filter="url(#aurora-fx)" style={{ mixBlendMode: 'screen' }}>
          <rect className="ab" x="-30%" y="-15%" width="160%" height="70%" fill="url(#ag-a)" opacity="0.72" />
          <rect className="ab" x="-30%" y="5%"   width="160%" height="65%" fill="url(#ag-b)" opacity="0.60" />
          <rect className="ab" x="-30%" y="20%"  width="160%" height="62%" fill="url(#ag-c)" opacity="0.65" />
          <rect className="ab" x="-30%" y="38%"  width="160%" height="60%" fill="url(#ag-d)" opacity="0.52" />
          <rect className="ab" x="-30%" y="12%"  width="160%" height="55%" fill="url(#ag-e)" opacity="0.45" />
          <rect className="ab" x="-30%" y="45%"  width="160%" height="55%" fill="url(#ag-a)" opacity="0.38" />
          <rect className="ab" x="-30%" y="58%"  width="160%" height="52%" fill="url(#ag-d)" opacity="0.42" />
          <rect className="ab" x="-30%" y="-5%"  width="160%" height="48%" fill="url(#ag-c)" opacity="0.35" />
          <rect className="ab" x="-30%" y="65%"  width="160%" height="50%" fill="url(#ag-b)" opacity="0.40" />
          <rect className="ab" x="-30%" y="28%"  width="160%" height="58%" fill="url(#ag-e)" opacity="0.32" />
        </g>
      </svg>
    </div>
  );
}
