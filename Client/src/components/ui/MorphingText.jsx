import { useCallback, useEffect, useRef } from "react";

const morphTime = 1.9;
const cooldownTime = 0.6;

const useMorphingText = (texts, textColors = []) => {
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(cooldownTime);
  const timeRef = useRef(new Date());

  const text1Ref = useRef(null);
  const text2Ref = useRef(null);

  const setStyles = useCallback(
    (fraction) => {
      const current1 = text1Ref.current;
      const current2 = text2Ref.current;
      if (!current1 || !current2) return;

      const safeFraction = Math.max(fraction, 0.0001);
      const invertedFraction = Math.max(1 - fraction, 0.0001);

      current2.style.filter = `blur(${Math.min(8 / safeFraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      current1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];

      if (textColors.length > 0) {
        current1.style.color = textColors[textIndexRef.current % textColors.length];
        current2.style.color = textColors[(textIndexRef.current + 1) % textColors.length];
      }
    },
    [texts, textColors],
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
      textIndexRef.current += 1;
    }

    setStyles(fraction);
  }, [setStyles]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const current1 = text1Ref.current;
    const current2 = text2Ref.current;
    if (!current1 || !current2) return;

    current2.style.filter = "none";
    current2.style.opacity = "100%";
    current1.style.filter = "none";
    current1.style.opacity = "0%";
  }, []);

  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const newTime = new Date();
      const dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [doMorph, doCooldown]);

  return { text1Ref, text2Ref };
};

const Texts = ({ texts, textColors }) => {
  const { text1Ref, text2Ref } = useMorphingText(texts, textColors);

  return (
    <>
      <span
        className="absolute inset-x-0 top-0 m-auto inline-block w-full"
        ref={text1Ref}
      />
      <span
        className="absolute inset-x-0 top-0 m-auto inline-block w-full"
        ref={text2Ref}
      />
    </>
  );
};

const SvgFilters = () => (
  <svg className="hidden" preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

const MorphingText = ({ texts, textColors = [], className = "" }) => (
  <div
    className={`relative mx-auto h-20 w-full max-w-5xl text-center text-[46px] sm:text-[64px] lg:text-[92px] font-black leading-none tracking-tight [filter:url(#threshold)_blur(0.6px)] ${className}`}
    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
  >
    <Texts texts={texts} textColors={textColors} />
    <SvgFilters />
  </div>
);

export { MorphingText };
