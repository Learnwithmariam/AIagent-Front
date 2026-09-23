import React from 'react';

/** Fixed ambient background: drifting brand-colored light, a faint grid and film grain. */
export const Aurora: React.FC = () => (
  <div className="aurora" aria-hidden>
    <div className="aurora__blob aurora__blob--a" />
    <div className="aurora__blob aurora__blob--b" />
    <div className="aurora__blob aurora__blob--c" />
    <div className="aurora__grid" />
    <div className="noise" />
  </div>
);
