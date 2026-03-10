"use client";

import { useLanguage } from "../LanguageContext";
import { useRouter } from "next/navigation";
import { Scan, Sprout, ArrowRight, ShieldCheck, Database, Layers } from "lucide-react";

export default function Dashboard() {
    const { language } = useLanguage();
    const router = useRouter();

    const features = [
        { icon: <ShieldCheck size={28} className="text-gradient" />, title: "WHO Guidelines", desc: "Data strictly verified against global health standards." },
        { icon: <Database size={28} className="text-gradient" />, title: "AYUSH Approved", desc: "Referencing the authentic Pharmacopoeia of India." },
        { icon: <Layers size={28} className="text-gradient" />, title: "Deep Analysis", desc: "Dosages, preparation methods, and detailed contraindications." }
    ];

    const mainPlants = [
        { name: "Tulsi (Holy Basil)", desc: "Known as the \"Queen of Herbs\", powerful adaptogen.", img: "🌿" },
        { name: "Ashwagandha", desc: "Ancient root for maximum stress relief and vitality.", img: "🌱" },
        { name: "Neem", desc: "Nature's ultimate antibacterial and purifying agent.", img: "🍃" },
        { name: "Amla (Indian Gooseberry)", desc: "Potent antioxidant packed with Vitamin C and immunity.", img: "🍈" }
    ];

    return (
        <div className="container animate-fade-in" style={{ flex: 1 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                    Veda<span className="text-gradient">Vision</span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <GlobeIcon size={16} /> Language: <strong style={{ color: 'var(--text-primary)' }}>{language}</strong>
                </div>
            </header>

            {/* Hero Section */}
            <section className="glass-panel" style={{ padding: '4rem', marginBottom: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem', background: 'linear-gradient(145deg, rgba(15,17,21,0.6) 0%, rgba(16,185,129,0.05) 100%)' }}>
                <div style={{ flex: 1, minWidth: '350px' }}>
                    <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                        Gemini 1.5 Powered
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                        Preserve <span className="text-gradient">Ancient</span> Intelligence.
                    </h1>
                    <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6, maxWidth: '600px' }}>
                        Upload or capture an image of any medicinal plant. Our state-of-the-art vision model identifies it instantly, retrieving authoritative Ayurvedic profiles based on AYUSH & WHO datasets.
                    </p>
                    <button className="primary-button" onClick={() => router.push("/scan")} style={{ padding: '1.2rem 2.5rem', fontSize: '1.15rem' }}>
                        <Scan size={22} /> Start AI Scanner <ArrowRight size={20} />
                    </button>
                </div>

                {/* Abstract Hero Graphic */}
                <div className="animate-float" style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: '300px' }}>
                    <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                        <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(16,185,129,0.2)', borderRadius: '50%', animation: 'spin 20s linear infinite' }}></div>
                        <div style={{ position: 'absolute', inset: '20px', border: '2px dashed rgba(16,185,129,0.4)', borderRadius: '50%', animation: 'spin 15s linear infinite reverse' }}></div>
                        <div style={{ position: 'absolute', inset: '60px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px var(--accent-glow)' }}>
                            <Sprout size={80} className="text-gradient" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pillars Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                {features.map((feat, i) => (
                    <div key={i} style={{ padding: '2rem', background: 'transparent', borderLeft: '2px solid var(--border-color)', transition: 'all 0.3s' }} className="feature-item">
                        <div style={{ background: 'rgba(255,255,255,0.03)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            {feat.icon}
                        </div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem' }}>{feat.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feat.desc}</p>
                    </div>
                ))}
            </div>

            {/* Featured Plants */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    Explore Knowledge Base
                </h3>
                <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>View Complete Index &rarr;</span>
            </div>

            <div className="grid-cards">
                {mainPlants.map((plant, idx) => (
                    <div key={idx} className="glass-panel plant-card">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px' }}>
                            {plant.img}
                        </div>
                        <h4 style={{ marginBottom: '0.8rem', fontSize: '1.25rem' }}>{plant.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{plant.desc}</p>
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .feature-item:hover {
          border-left-color: var(--accent-primary);
          background: linear-gradient(90deg, rgba(16,185,129,0.05), transparent);
        }

        .plant-card {
          padding: 2rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .plant-card:hover {
          transform: translateY(-8px);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 15px 40px rgba(16, 185, 129, 0.15);
        }
      `}</style>
        </div>
    );
}

function GlobeIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" />
        </svg>
    );
}
