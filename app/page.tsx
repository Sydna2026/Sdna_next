"use client";

import React, { useState, useEffect } from 'react';
import SubscribeForm from './components/SubscribeForm';
import {
  DEFAULT_HOME,
  DEFAULT_CONTACT,
  DEFAULT_FOOTER,
  DEFAULT_BRANDING,
  DEFAULT_GUIDELINES,
  type HomeContent,
  type ContactContent,
  type FooterContent,
  type BrandingContent,
  type GuidelineContent,
} from '@/lib/defaults';

interface ContentBundle {
  home: HomeContent;
  contact: ContactContent;
  footer: FooterContent;
  branding: BrandingContent;
  guidelines: GuidelineContent[];
}

const DEFAULT_CONTENT: ContentBundle = {
  home: DEFAULT_HOME,
  contact: DEFAULT_CONTACT,
  footer: DEFAULT_FOOTER,
  branding: DEFAULT_BRANDING,
  guidelines: DEFAULT_GUIDELINES,
};

// =========================================================================
// TYPES & INTERFACES
// =========================================================================
interface GuidelineItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  desc: string;
  details: string[];
}

interface OurProjectPageProps {
  contact: ContactContent;
  onOpenSpecializations: () => void;
  triggerToast: (message: string) => void;
}

interface SpecializationsPageProps {
  guidelines: GuidelineItem[];
  onOpenGuideline: (guideline: GuidelineItem) => void;
  onBack: () => void;
}

interface HomePageProps {
  home: HomeContent;
}

interface ContactSectionProps {
  contact: ContactContent;
}

// =========================================================================
// PREMIUM LOGO ASSETS
// =========================================================================
const HERO_LOGO_URL = "/Logo-Icon-rose-ash.png";       
const JOIN_US_LOGO_URL = "/Logo-Icon-rose-ash.png";   
const NAV_LOGO_URL = "/Logo-Icon-light-ivory.png"; 
const logo ="/Syrian-Dental-Academic-Network-Logo-Light-ivory.png";


const orthodontics = "/orthodontics.png";
const fixed_prosthodontics = "/fixed_prosthodontics.png";
const oral_surgery = "/oral_surgery.png";
const pediatric_dentistry = "/pediatric_dentistry.png";
const Endodontics = "/Endodontics.png";
const Oral_medicine = "/Oral medicine.png";
const pathology = "/pathology.png";
const removable_prosthodontics = "/removable_prosthodontics.png";

// Icons stay in code, keyed by specialization slug; text comes from the DB.
const ICON_BY_SLUG: Record<string, React.ReactNode> = {
  "ortho": <img src={orthodontics} alt="Orthodontics" className="w-8 h-8 object-contain" />,
  "surgery": <img src={oral_surgery} alt="Oral Surgery" className="w-8 h-8 object-contain" />,
  "fixed-prostho": <img src={fixed_prosthodontics} alt="Fixed Prosthodontics" className="w-8 h-8 object-contain" />,
  "removable-prostho": <img src={removable_prosthodontics} alt="Removable Prosthodontics" className="w-8 h-8 object-contain" />,
  "pediatric": <img src={pediatric_dentistry} alt="Pediatric Dentistry" className="w-8 h-8 object-contain" />,
  "endodontics": <img src={Endodontics} alt="Endodontics" className="w-8 h-8 object-contain" />,
  "medicine": <img src={Oral_medicine} alt="Oral Medicine" className="w-8 h-8 object-contain" />,
  "histology": <img src={pathology} alt="Oral Histology" className="w-8 h-8 object-contain" />,
};

function guidelineItems(guidelines: GuidelineContent[]): GuidelineItem[] {
  return guidelines.map((g) => ({
    id: g.slug,
    title: g.title,
    desc: g.desc,
    details: g.details,
    icon: ICON_BY_SLUG[g.slug] ?? null,
  }));
}

export default function NextApp() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedGuideline, setSelectedGuideline] = useState<GuidelineItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrollOpacity, setScrollOpacity] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [content, setContent] = useState<ContentBundle>(DEFAULT_CONTENT);

  useEffect(() => {
    fetch('/api/content')
      .then((r) => r.json())
      .then((d) => { if (d?.ok && d.content) setContent(d.content); })
      .catch(() => {});
  }, []);

  const guidelines = guidelineItems(content.guidelines);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      const computedOpacity = Math.min(Math.max(position / (window.innerHeight * 0.40), 0.0), 1.0);
      setScrollOpacity(computedOpacity);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const renderNavbar = () => {
    const bgStyle = {
      backgroundColor: `rgba(74, 74, 74, ${scrollOpacity > 0.1 ? 0.95 : scrollOpacity})`,
      boxShadow: scrollOpacity > 0.1 ? '0 10px 30px -10px rgba(0, 0, 0, 0.3)' : 'none',
    };

    return (
      <nav 
        style={bgStyle}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 border-b border-white/5 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer space-x-3 group" 
              onClick={() => setCurrentPage('home')}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center transition-all group-hover:scale-105">
                <img 
                  src={NAV_LOGO_URL} 
                  alt="SDAN Logo Ivory" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[#F9ECE4] font-black text-xl tracking-wider leading-none">{content.branding.brand}</span>
                <span className="text-[#A08C8A] font-light text-[10px] tracking-widest uppercase">{content.branding.subtitle}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {[
                { id: 'home', label: 'Home' },
                { id: 'project', label: 'Our Projects'},
                { id: 'join', label: 'Join Us' },
                { id: 'contact', label: 'Contact Us' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setCurrentPage(tab.id)}
                  className={`transition-all duration-200 font-bold px-4 py-2 text-xs uppercase tracking-widest relative group ${
                    currentPage === tab.id ? 'text-[#A08C8A]' : 'text-[#F9ECE4] hover:text-[#A08C8A]'
                  }`}
                >
                  {tab.label}
                  <span className={`absolute bottom-0 left-4 right-4 h-0.5 bg-[#A08C8A] transition-transform duration-300 ${
                    currentPage === tab.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`} />
                </button>
              ))}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#F9ECE4] hover:text-[#A08C8A] focus:outline-none p-2 transition-all"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#4A4A4A] border-t border-white/5 px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-2xl">
            {[
              { id: 'home', label: 'Home' },
                { id: 'project', label:'Our Projects'},
                { id: 'join', label: 'Join Us' },
                { id: 'contact', label: 'Contact Us' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setCurrentPage(tab.id); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${
                  currentPage === tab.id ? 'bg-[#A08C8A] text-white shadow-lg' : 'text-[#F9ECE4] hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#4A4A4A] text-gray-100 selection:bg-[#A08C8A] selection:text-white transition-colors duration-300">
      <style>{`
        body { background-color: #4A4A4A; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>

      {renderNavbar()}

      <div className="flex-grow pt-20">
        {currentPage === 'home' && <HomePage home={content.home} />}
        {currentPage === 'project' && <OurProjectPage contact={content.contact} onOpenSpecializations={() => setCurrentPage('specializations')} triggerToast={triggerToast}/>}
        {currentPage === 'specializations' && <SpecializationsPage guidelines={guidelines} onOpenGuideline={setSelectedGuideline} onBack={() => setCurrentPage('project')} />}
        {currentPage === 'join' && <JoinUsPage contact={content.contact} />}
        {currentPage === 'contact' && <ContactPage contact={content.contact} />}
      </div>

      <footer className="bg-[#3D3D3D] py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[#F9ECE4] text-xs font-semibold tracking-widest uppercase opacity-75">
            {content.footer.copyright}
          </p>
        </div>
      </footer>

      {selectedGuideline && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#F9ECE4] rounded-[24px] border-2 border-[#A08C8A] max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-[#4A4A4A] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#A08C8A]/20 rounded-[16px] text-[#4A4A4A] flex-shrink-0">{selectedGuideline.icon}</div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#4A4A4A]">{selectedGuideline.title}</h3>
              </div>
              <button onClick={() => setSelectedGuideline(null)} className="text-[#4A4A4A]/60 hover:text-[#A08C8A] transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <hr className="border-[#A08C8A]/30 mb-5" />
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black text-[#A08C8A] uppercase tracking-widest mb-2">Overview</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedGuideline.desc}</p>
              </div>
              <div>
                <h4 className="text-xs font-black text-[#A08C8A] uppercase tracking-widest mb-3">Key Aspects</h4>
                <ul className="space-y-3">
                  {selectedGuideline.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-3 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-[#A08C8A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4" /></svg>
                      <span className="leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-black text-[#A08C8A] uppercase tracking-widest mb-3">Newsletter</h4>
                <SubscribeForm slug={selectedGuideline.id} title={selectedGuideline.title} />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setSelectedGuideline(null)} className="bg-[#4A4A4A] text-white hover:bg-[#333333] transition-all px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase shadow-md">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#A08C8A] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 z-50 animate-bounce max-w-sm">
          <span className="text-xs font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

const ABOUT_ICON_PATHS = [
  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
];

function HomePage({ home }: HomePageProps) {
  return (
    <div className="animate-fadeIn">
      <section className="relative bg-gradient-to-b from-[#4A4A4A] to-[#3B3B3B] py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="mb-8">
<div className="bg-white/5 rounded-[24px] border border-white/10 p-5 w-[220px] h-[220px] flex items-center justify-center shadow-2xl backdrop-blur-md overflow-hidden hover:scale-105 transition-transform duration-300">
  <img src={logo} alt="SYDAN Emblem" className="object-contain w-full h-full" />
</div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#F9ECE4] tracking-tight mb-8">{home.heroLine1}<br /><span className="text-[#A08C8A]">{home.heroLine2}</span></h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-6">{home.heroSubtitle}</p>
        </div>
      </section>
      <section className="bg-[#F9ECE4] text-[#4A4A4A] py-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-black text-[#4A4A4A] uppercase tracking-widest mb-3">{home.aboutHeading}</h2><div className="w-[80px] h-[4px] bg-[#A08C8A] rounded-[2px] mx-auto"></div></div>
          <div className="space-y-8">
            {home.cards.map((item, idx) => (
              <div key={idx} className="bg-white rounded-[24px] border border-[#E5D5CD] p-8 shadow-sm flex items-start space-x-6">
                <div className="p-4 bg-[#A08C8A]/15 rounded-2xl text-[#A08C8A]"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ABOUT_ICON_PATHS[idx % ABOUT_ICON_PATHS.length]} /></svg></div>
                <div><h3 className="text-xl md:text-2xl font-extrabold text-[#4A4A4A] mb-3">{item.title}</h3><p className="text-sm md:text-base text-gray-700 leading-relaxed">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OurProjectPage({ contact, onOpenSpecializations, triggerToast }: OurProjectPageProps) {
  return (
    <div className="bg-[#4A4A4A] animate-fadeIn p-4">
      <div className="w-full min-h-[220px] flex flex-col justify-center items-center py-10">
        <h2 className="text-3xl sm:text-4xl font-black text-[#A08C8A] tracking-[3px] uppercase text-center mb-3">OUR PROJECTS</h2>
        <p className="text-sm sm:text-base text-white/70 text-center max-w-xl font-medium">Explore our dental research courses, guidelines, and share your vision</p>
      </div>
      <div className="max-w-3xl mx-auto mb-16 space-y-8">
        <div className="bg-white rounded-[24px] border p-8 shadow-xl text-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#A08C8A]/10 rounded-xl text-[#A08C8A]"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></div>
            <div className="bg-[#FF0000] text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider">YouTube</div>
          </div>
          <h3 className="text-2xl font-black text-[#4A4A4A] mb-3">Dental Research Course</h3>
          <p className="text-[#4A4A4A] text-sm sm:text-base leading-relaxed mb-6 font-medium">Advance your career with our specialized dental research methodology training.</p>
          <div className="grid grid-cols-2 gap-4">
            <button className="border-2 border-[#4A4A4A] text-[#4A4A4A] text-xs font-bold py-3.5 rounded-xl uppercase hover:bg-gray-100 transition-colors">YouTube Course</button>
            <button onClick={() => triggerToast("Registration for 1:1 mentorship and classes will open soon!")} className="bg-[#A08C8A] text-white text-xs font-bold py-3.5 rounded-xl uppercase hover:bg-[#8e7a78] transition-colors">1:1 Paid Course</button>
          </div>
        </div>
        <div className="bg-white rounded-[24px] border p-8 shadow-xl text-gray-800">
          <div className="p-3 bg-[#A08C8A]/10 rounded-xl text-[#A08C8A] w-fit mb-4"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
          <h3 className="text-2xl font-black text-[#4A4A4A] mb-3">Share Your Ideas</h3>
          <a href={contact.shareIdeasUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-[#4A4A4A] text-white font-bold py-4 rounded-xl text-center uppercase tracking-wider hover:bg-[#333] transition-colors">Google Form Link</a>
        </div>
        <div className="bg-white rounded-[24px] border p-8 shadow-xl text-gray-800">
          <div className="p-3 bg-[#A08C8A]/10 rounded-xl text-[#A08C8A] w-fit mb-4"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
          <h3 className="text-2xl font-black text-[#4A4A4A] mb-3">Guidelines</h3>
          <p className="text-[#4A4A4A] text-sm sm:text-base leading-relaxed mb-6 font-medium">Evidence-based clinical guidelines across every dental specialization. Click below to browse all specializations, read the key aspects of each field, and subscribe to receive new research articles by email.</p>
          <button onClick={onOpenSpecializations} className="flex items-center justify-center w-full bg-[#A08C8A] text-white font-bold py-4 rounded-xl text-center uppercase tracking-wider hover:bg-[#8e7a78] transition-colors">Explore Specializations</button>
        </div>
      </div>
    </div>
  );
}

function SpecializationsPage({ guidelines, onOpenGuideline, onBack }: SpecializationsPageProps) {
  return (
    <div className="bg-[#4A4A4A] animate-fadeIn p-4">
      <div className="w-full min-h-[220px] flex flex-col justify-center items-center py-10">
        <h2 className="text-3xl sm:text-4xl font-black text-[#A08C8A] tracking-[3px] uppercase text-center mb-3">SPECIALIZATIONS</h2>
        <p className="text-sm sm:text-base text-white/70 text-center max-w-xl font-medium">Choose a specialization to read its clinical guidelines and subscribe for new research updates by email.</p>
        <button onClick={onBack} className="mt-5 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-[#A08C8A] transition-colors">&larr; Back to projects</button>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guidelines.map((item) => (
            <div key={item.id} onClick={() => onOpenGuideline(item)} className="bg-white rounded-[16px] border p-5 cursor-pointer hover:border-[#A08C8A] hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-center space-x-4"><div className="p-3 bg-[#A08C8A]/15 text-[#A08C8A] rounded-xl shrink-0">{item.icon}</div><h4 className="font-extrabold text-[#4A4A4A] leading-tight break-words">{item.title}</h4></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JoinUsPage({ contact }: ContactSectionProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-5xl mx-auto mt-8">
        
        {/* Left Side: Logo & Subtitle */}
<div className="flex flex-col items-center space-y-4 text-center md:w-1/2">
  <img
    src={JOIN_US_LOGO_URL}
    alt="Scientific Dental Association Network"
    className="object-contain w-[280px] h-[280px] transition-transform hover:scale-105 duration-300"
  />

  <p className="text-sm font-semibold tracking-wider text-white/50 uppercase pt-2">
    Scientific Dental Association Network
  </p>
</div>

        {/* Right Side: Modern Form Container */}
        <div className="bg-white rounded-[32px] p-8 sm:p-10 text-gray-800 shadow-2xl w-full md:w-1/2 max-w-md">
          <h3 className="text-2xl sm:text-3xl font-black text-[#4A4A4A] tracking-tight mb-2">Application Form</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Please fill out our official registration form to submit your application and request to join us.
          </p>
          
          <a
            href={contact.joinFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full bg-[#A08C8A] text-white font-bold py-3.5 rounded-2xl text-center text-sm uppercase tracking-wide hover:bg-[#8e7a78] shadow-md transition-all mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Fill the Google Form</span>
          </a>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold tracking-widest uppercase">Or Connect Via</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Social Links List */}
          <div className="space-y-3">
            
            {/* Email item */}
            <a
              href={`mailto:${contact.gmail}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-[#F9ECE4]/30 hover:border-[#A08C8A]/30 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#4A4A4A] flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Official Gmail</span>
                  <span className="text-sm font-semibold text-gray-700 truncate max-w-[180px] sm:max-w-none">{contact.gmail}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#A08C8A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* Instagram item */}
            <a
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-[#F9ECE4]/30 hover:border-[#A08C8A]/30 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#4A4A4A] flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instagram Profile</span>
                  <span className="text-sm font-semibold text-gray-700">@syrian.dan</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#A08C8A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* LinkedIn item */}
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-[#F9ECE4]/30 hover:border-[#A08C8A]/30 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#4A4A4A] flex items-center justify-center text-white shadow-sm font-black text-sm">
                  in
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">LinkedIn Page</span>
                  <span className="text-sm font-semibold text-gray-700">SYDAN Network</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#A08C8A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage({ contact }: ContactSectionProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fadeIn">
      <div className="text-center mb-12"><h2 className="text-3xl font-black text-[#F9ECE4] uppercase tracking-wider">CONTACT US</h2></div>
      
      <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl max-w-2xl mx-auto text-gray-800">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-md border p-2 mb-4 hover:scale-105 transition-transform">
            <img src={HERO_LOGO_URL} alt="Contact" className="w-full h-full object-contain" />
          </div>
          <h4 className="text-xl font-black text-[#4A4A4A]">{contact.adminName}</h4>
          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">{contact.adminTitle}</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          
          {/* Email Card */}
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-[#F9ECE4]/30 hover:border-[#A08C8A]/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#A08C8A] text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-[#A08C8A] transition-colors">{contact.email}</span>
            </div>
          </a>

          {/* Phone Card */}
          <a
            href={`tel:${contact.phone.replace(/\s+/g, '')}`}
            className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-[#F9ECE4]/30 hover:border-[#A08C8A]/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#A08C8A] text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone / WhatsApp</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-[#A08C8A] transition-colors" dir="ltr">{contact.phone}</span>
            </div>
          </a>

          {/* Instagram Card */}
          <a
            href={contact.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-[#F9ECE4]/30 hover:border-[#A08C8A]/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#A08C8A] text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instagram Network</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-[#A08C8A] transition-colors">@syrian.dan</span>
            </div>
          </a>

        </div>
      </div>
    </div>
  );
}