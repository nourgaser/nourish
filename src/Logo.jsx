import React from 'react';

export const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pixel Art Apple Style */}
    <rect x="12" y="4" width="4" height="6" className="fill-emerald-500" />
    <rect x="16" y="6" width="4" height="2" className="fill-emerald-400" />
    <path d="M8 10H24V26H8V10Z" className="fill-rose-500" />
    <path d="M6 12H8V24H6V12Z" className="fill-rose-600" />
    <path d="M24 12H26V24H24V12Z" className="fill-rose-600" />
    <path d="M8 26H24V28H8V26Z" className="fill-rose-700" />
    {/* Shine */}
    <rect x="20" y="12" width="2" height="4" className="fill-rose-300" />
  </svg>
);