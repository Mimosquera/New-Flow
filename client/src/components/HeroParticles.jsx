import { useEffect, useRef } from 'react';

const COUNT = 28;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function makeParticle(w, h, atTop = false) {
  const type = Math.random() < 0.45 ? 'hair' : 'scissors';
  const isTeal = Math.random() > 0.45;
  return {
    type,
    x: rand(0, w),
    y: atTop ? rand(-80, -6) : rand(0, h),
    size: type === 'scissors' ? rand(13, 22) : rand(12, 26),
    angle: rand(0, Math.PI * 2),
    vy: rand(0.18, 0.38),
    vx: rand(-0.09, 0.09),
    vr: rand(-0.004, 0.004),
    lw: type === 'scissors' ? rand(0.8, 1.4) : rand(0.8, 1.5),
    opacity: rand(0.14, isTeal ? 0.38 : 0.22),
    isTeal,
    curve: rand(0.15, 0.35) * (Math.random() < 0.5 ? 1 : -1),
    fadeY: Math.random() < 0.4 ? rand(h * 0.2, h * 0.7) : null,
  };
}

function drawScissors(ctx, size) {
  const b = size * 0.48;
  const hr = size * 0.13;
  const spread = 0.32;

  ctx.beginPath();
  ctx.moveTo(-b, -b * spread);
  ctx.lineTo(0, 0);
  ctx.lineTo(b, -b * spread);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-b, b * spread);
  ctx.lineTo(0, 0);
  ctx.lineTo(b, b * spread);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, size * 0.055, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-b, -b * spread, hr, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-b, b * spread, hr, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHair(ctx, size, curve) {
  const half = size / 2;
  ctx.beginPath();
  ctx.moveTo(-half, 0);
  ctx.quadraticCurveTo(0, size * curve, half, 0);
  ctx.stroke();
}

export const HeroParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let rafId;
    let w = 0;
    let h = 0;
    let particles = [];

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const init = () => {
      resize();
      particles = Array.from({ length: COUNT }, () => makeParticle(w, h, false));
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // Fade in at top edge, fade out at bottom edge
        const cy = Math.max(0, Math.min(h, p.y));
        const edgeDist = Math.min(cy, h - cy);
        const edgeFade = Math.min(1, edgeDist / (h * 0.10));

        // Optional early fade-out for select particles
        const earlyFade = p.fadeY !== null
          ? Math.max(0, 1 - Math.max(0, p.y - p.fadeY) / (h * 0.15))
          : 1;

        const alpha = p.opacity * edgeFade * earlyFade;

        if (alpha > 0.005) {
          const color = p.isTeal
            ? `rgba(70,161,161,${alpha})`
            : `rgba(100,180,215,${alpha})`;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = p.lw;
          ctx.lineCap = 'round';

          if (p.type === 'scissors') {
            drawScissors(ctx, p.size);
          } else {
            drawHair(ctx, p.size, p.curve);
          }

          ctx.restore();
        }

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.vr;

        if (p.y > h + 30) {
          Object.assign(p, makeParticle(w, h, true));
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    init();
    tick();

    let resizeTimer;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 80);
    };

    const ro = new ResizeObserver(debouncedResize);
    ro.observe(canvas.parentElement);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
      }}
    />
  );
};
