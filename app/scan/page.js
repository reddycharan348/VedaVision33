"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2, ArrowLeft, Zap, Shield, FileText, Search, AlertTriangle, ChevronRight } from "lucide-react";

export default function ScanPage() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [availablePlants, setAvailablePlants] = useState([]);

    const fileInputRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        // Fetch the list of available plants on load
        fetch('/api/plants')
            .then(res => res.json())
            .then(data => setAvailablePlants(data))
            .catch(err => console.error("Failed to fetch plants registry:", err));
    }, []);

    const filteredPlants = searchQuery.length > 0
        ? availablePlants.filter(p =>
            p.identity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.scientificName && p.scientificName.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
    };

    const processFile = (f) => {
        setFile(f);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(f);
        setSearchQuery(""); // Clear search if image uploaded
        setError("");
    };

    const startAnalysis = async () => {
        if (!preview && !searchQuery) {
            setError("Please upload an image or enter a plant name to search.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: preview || null,
                    query: searchQuery || null
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze plant.");
            }

            // Save the returned JSON data and any uploaded image strictly for display
            localStorage.setItem("veda_plant_data", JSON.stringify(data));
            if (preview) {
                localStorage.setItem("veda_image", preview.split(',')[1]);
            } else {
                localStorage.removeItem("veda_image");
            }

            router.push("/results");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button className="back-button" onClick={() => router.push("/dashboard")}>
                    <ArrowLeft size={20} /> Dashboard
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    <Zap size={18} fill="currentColor" /> Hybrid Local AI Engine Active
                </div>
            </header>

            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                {/* Left Side: Upload + Search */}
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '1rem', fontSize: '2.8rem' }}>AI Scanner Engine</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1.15rem', lineHeight: 1.6 }}>
                            Upload an image for Gemini AI identification, or directly search for a plant to fetch its verified AYUSH/WHO medical profile.
                        </p>
                    </div>

                    {/* Image Upload Zone */}
                    <div
                        className={`glass-panel dropzone`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            minHeight: preview ? '300px' : '200px',
                            border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
                            background: isDragging ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

                        {preview ? (
                            <img src={preview} alt="Preview" style={{ objectFit: 'contain', width: '100%', height: '100%', maxHeight: '280px', borderRadius: '16px', zIndex: 1 }} />
                        ) : (
                            <div style={{ textAlign: 'center', zIndex: 1, padding: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '50%', display: 'inline-block', marginBottom: '1rem' }}>
                                    <ImageIcon size={36} color="var(--accent-primary)" />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>Upload Plant Image</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Drag & drop or click to browse</p>
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>OR</div>

                    {/* Plant Search */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Search size={20} className="text-gradient" /> Search Database Directly
                        </h3>

                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '24px', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder={`E.g., Tulsi, Ashwagandha... (${availablePlants.length} plants offline)`}
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPreview(""); setFile(null); setError(""); }}
                                style={{
                                    width: '100%',
                                    padding: '14px 14px 14px 44px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)',
                                    fontSize: '1.05rem',
                                    outline: 'none',
                                    fontFamily: 'var(--font-body)',
                                    transition: 'border-color 0.3s'
                                }}
                            />

                            {/* Autocomplete Dropdown */}
                            {filteredPlants.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: '#1a1f26',
                                    border: '1px solid var(--border-color)',
                                    borderTop: 'none',
                                    borderRadius: '0 0 12px 12px',
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    zIndex: 10,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    marginTop: '-4px'
                                }} className="plant-list-scroll">
                                    {filteredPlants.map((plant) => (
                                        <button
                                            key={plant.id}
                                            className="plant-select-item"
                                            onClick={() => {
                                                setSearchQuery(plant.identity);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '12px 16px',
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                width: '100%',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                color: 'var(--text-primary)',
                                                gap: '12px'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.4rem' }}>{plant.emoji}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{plant.identity}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{plant.scientificName}</div>
                                            </div>
                                            <ChevronRight size={16} color="var(--border-color)" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Analysis Panel */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div className="glass-panel info-card" style={{ padding: '2.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <Shield size={24} className="text-gradient" /> Local Data Architecture
                        </h3>
                        <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8 }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><div className="dot"></div> Strictly mapped against <b>WHO Monographs</b></li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><div className="dot"></div> Confirmed via <b>AYUSH Guidelines</b></li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><div className="dot"></div> Dedicated JSON node per plant</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><div className="dot"></div> Absolute privacy (No External Data API)</li>
                        </ul>
                    </div>

                    <div className="glass-panel info-card" style={{ padding: '2.5rem', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                            <FileText size={24} /> Process Request
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                            Click below to either run the AI vision model on your image to locate the correct file, or query the database directly.
                        </p>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                <AlertTriangle size={18} flexShrink={0} /> <span>{error}</span>
                            </div>
                        )}

                        <button
                            className="primary-button"
                            onClick={startAnalysis}
                            disabled={isLoading || (!preview && !searchQuery)}
                            style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="spin" size={24} /> Processing...
                                </>
                            ) : (
                                <>
                                    <Camera size={24} /> Analyze & Fetch Profile
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        .dropzone:hover { 
          border-color: var(--accent-primary) !important; 
          background: rgba(16, 185, 129, 0.05) !important; 
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        }

        .back-button {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 10px 20px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          cursor: pointer;
          transition: all 0.3s;
        }

        .back-button:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(-4px);
        }

        .info-card {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .info-card:hover {
          transform: translateY(-4px);
        }

        .dot {
          width: 8px;
          height: 8px;
          min-width: 8px;
          background: var(--accent-primary);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-glow);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        input:focus {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .plant-select-item:hover {
          background: rgba(16, 185, 129, 0.08) !important;
          padding-left: 20px !important;
          transition: all 0.2s ease;
        }

        .plant-list-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .plant-list-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .plant-list-scroll::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }
        .plant-list-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--accent-primary);
        }
      `}</style>
        </div>
    );
}
