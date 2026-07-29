import React from 'react';

export default function HeroBackground({ children, className = '' }) {
  return (
    <section className={`hero-background-container relative overflow-hidden ${className}`}>
      <div className="hero-background-radial hero-background-left" aria-hidden="true" />
      <div className="hero-background-radial hero-background-right" aria-hidden="true" />
      <div className="hero-background-topfade" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
