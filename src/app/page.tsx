"use client";
import React from "react";
import { FooterWithModals } from "@/components/home/LegalModals";
import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { FeaturesGrid } from "@/components/home/Features";
import { PricingGrid } from "@/components/home/Pricing";
import { CTA } from "@/components/home/CTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative">
      {/* BACKGROUND DECORATION */}
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-250 h-150 bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <Header />
      <Hero />
      <FeaturesGrid />
      <PricingGrid />
      <CTA />
      <FooterWithModals />
    </main>
  );
}
