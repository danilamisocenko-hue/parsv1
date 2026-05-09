import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  sticky: boolean;
};

export function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(92, Math.max(46, Math.floor((window.innerWidth * window.innerHeight) / 18000)));
      particlesRef.current = Array.from({ length: count }, (_, index) => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        return {
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          radius: index % 9 === 0 ? 1.8 : 0.9 + Math.random() * 1.2,
          color: "rgba(235,238,255,0.9)",
          alpha: 0.18 + Math.random() * 0.42,
          sticky: true,
        };
      });
    };

    const addBurst = (x: number, y: number, type: string) => {
      const palette = type === "primary"
        ? ["rgba(255,255,255,0.95)", "rgba(129,140,248,0.92)", "rgba(79,70,229,0.82)"]
        : ["rgba(129,140,248,0.75)", "rgba(255,255,255,0.65)", "rgba(168,85,247,0.55)"];

      for (let i = 0; i < 34; i += 1) {
        const angle = (Math.PI * 2 * i) / 34 + Math.random() * 0.32;
        const speed = 1.2 + Math.random() * (type === "primary" ? 6.8 : 4.4);
        particlesRef.current.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.2 + Math.random() * 2.8,
          color: palette[i % palette.length],
          alpha: 1,
          sticky: false,
        });
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
    };

    const onBurst = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      addBurst(detail.x ?? pointerRef.current.x, detail.y ?? pointerRef.current.y, detail.type ?? "normal");
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const gradient = ctx.createRadialGradient(
        pointerRef.current.x,
        pointerRef.current.y,
        0,
        pointerRef.current.x,
        pointerRef.current.y,
        420
      );
      gradient.addColorStop(0, "rgba(99,102,241,0.075)");
      gradient.addColorStop(0.42, "rgba(99,102,241,0.025)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const pointer = pointerRef.current;
      particlesRef.current = particlesRef.current.filter((particle) => particle.sticky || particle.alpha > 0.02);
      particlesRef.current.forEach((particle) => {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distance = Math.hypot(dx, dy) || 1;

        if (particle.sticky) {
          const pullRadius = 180;
          const pull = Math.max(0, 1 - distance / pullRadius);
          const homeX = particle.originX - particle.x;
          const homeY = particle.originY - particle.y;

          particle.vx += homeX * 0.0014 + (dx / distance) * pull * 0.085;
          particle.vy += homeY * 0.0014 + (dy / distance) * pull * 0.085;
          particle.vx *= 0.925;
          particle.vy *= 0.925;
        } else {
          particle.vx *= 0.965;
          particle.vy *= 0.965;
          particle.vy += 0.012;
          particle.alpha *= 0.965;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        const stickyGlow = particle.sticky && distance < 185 ? (1 - distance / 185) * 0.75 : 0;
        ctx.globalAlpha = Math.min(1, particle.alpha + stickyGlow);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * (particle.sticky ? 1 + stickyGlow : 1.2), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("canvas-burst", onBurst);
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("canvas-burst", onBurst);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1] mix-blend-screen"
      aria-hidden="true"
    />
  );
}
