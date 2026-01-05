import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  Menu,
  X,
  ChevronDown,
  Activity,
  ShieldCheck,
  Banknote,
  AlertOctagon,
  EyeOff,
  Calculator,
  Handshake,
  ArrowUpRight,
  Bell,
  Upload,
  ScanLine,
  MessageSquareWarning,
  Mail,
  Star,
  Quote,
  Zap,
  HelpCircle,
  ChefHat,
  Utensils
} from 'lucide-react';

// --- COMPOSANTS UI (Style Shadcn) ---

const Button = ({ children, variant = "default", size = "default", className = "", ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90 shadow-sm",
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90 shadow-sm",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
    link: "text-slate-900 underline-offset-4 hover:underline",
    blue: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20"
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>{children}</div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const styles = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
    outline: "text-slate-950 border-slate-200",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    green: "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200/80",
    red: "border-transparent bg-red-100 text-red-700 hover:bg-red-200/80",
    blue: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200/80"
  };
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
};

// --- MAIN PAGE ---

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // États pour le compteur "Pro"
  const [totalSavedTarget, setTotalSavedTarget] = useState(482930);
  const [totalSavedDisplay, setTotalSavedDisplay] = useState(482930);
  const [lastIncrement, setLastIncrement] = useState(0);
  const [showIncrement, setShowIncrement] = useState(false);
  
  const [turnover, setTurnover] = useState(60000); 
  const [activeStep, setActiveStep] = useState(0);
  const [isHoveringSteps, setIsHoveringSteps] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logique d'incrémentation de la cible (simule l'activité réelle)
  useEffect(() => {
    const interval = setInterval(() => {
      // Ajout d'un montant réaliste
      const increment = Math.floor(Math.random() * 45) + 15;
      setLastIncrement(increment);
      setTotalSavedTarget(prev => prev + increment);
      setShowIncrement(true);
      
      // Reset animation state
      setTimeout(() => setShowIncrement(false), 2000);
    }, 3500); // Mise à jour toutes les 3.5s
    return () => clearInterval(interval);
  }, []);

  // Logique d'animation fluide vers la cible (Effet compteur)
  useEffect(() => {
    if (totalSavedDisplay === totalSavedTarget) return;

    const diff = totalSavedTarget - totalSavedDisplay;
    // Vitesse adaptative : plus l'écart est grand, plus ça va vite
    const step = Math.ceil(diff / 10); 

    const timer = requestAnimationFrame(() => {
        setTotalSavedDisplay(prev => {
            const next = prev + step;
            return next > totalSavedTarget ? totalSavedTarget : next;
        });
    });

    return () => cancelAnimationFrame(timer);
  }, [totalSavedTarget, totalSavedDisplay]);


  // Rotation automatique des étapes (pause au survol)
  useEffect(() => {
    if (isHoveringSteps) return;
    const stepInterval = setInterval(() => {
        setActiveStep(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(stepInterval);
  }, [isHoveringSteps]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const estimatedGainMonthly = turnover * 0.05;
  const estimatedGainYearly = estimatedGainMonthly * 12;

  const steps = [
    {
      id: 0,
      title: "1. Envoie ta facture",
      description: "Glisse un PDF sur l'app ou transfère simplement le mail de ton fournisseur. Zéro saisie.",
      icon: <Upload size={20} />,
    },
    {
      id: 1,
      title: "2. L'IA détecte l'écart",
      description: "Elle compare chaque ligne à ton historique. Rien ne lui échappe.",
      icon: <ScanLine size={20} />,
    },
    {
      id: 2,
      title: "3. Tu reçois l'alerte",
      description: "Notifié par SMS avant de perdre 1€. Tu réagis immédiatement.",
      icon: <MessageSquareWarning size={20} />,
    }
  ];

  const faqs = [
    {
      question: "Dois-je passer mes nuits à tout saisir ?",
      answer: "Surtout pas. Ravy est conçu pour éliminer la saisie. Vous transférez vos factures par mail ou en photo, et notre IA s'occupe de tout classer et analyser. Votre seul travail : prendre les décisions."
    },
    {
      question: "Je ne suis pas ingénieur, est-ce compliqué ?",
      answer: "Non. Si vous savez utiliser une application météo, vous savez utiliser Ravy. Pas de jargon, pas de boutons inutiles. L'interface a été pensée par des restaurateurs, pour aller à l'essentiel en plein service."
    },
    {
      question: "Mon comptable fait déjà ça, non ?",
      answer: "Non. Votre comptable fait un constat fiscal (souvent 2 mois trop tard). Ravy est un outil de pilotage en temps réel. C'est la différence entre conduire en regardant le rétroviseur et conduire avec un GPS."
    },
    {
      question: "Est-ce compatible avec TOUS mes fournisseurs ?",
      answer: "Oui, absolument tous. Metro, Transgourmet, ou le petit maraîcher qui fait des factures papier. Tant qu'il y a une facture (PDF, photo, scan), Ravy sait la lire. Aucune connexion technique n'est requise."
    },
    {
      question: "Est-ce que je suis engagé ?",
      answer: "Jamais. Nous sommes convaincus que Ravy se rentabilise dès le premier mois. Vous restez parce que vous gagnez de l'argent, pas parce que vous êtes bloqué par un contrat. Résiliation en 1 clic."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- NAVIGATION --- */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">R</div>
              <span className="text-xl font-bold tracking-tight text-slate-900">RAVY</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#fonctionnement" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Comment ça marche</a>
              <a href="#temoignages" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Témoignages</a>
              <a href="#tarifs" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Tarifs</a>
              <Button variant="blue">
                Lancer l'audit gratuit
              </Button>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 p-4 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-5">
            <a href="#fonctionnement" className="text-slate-600 font-medium p-2 hover:bg-slate-50 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Comment ça marche</a>
            <a href="#tarifs" className="text-slate-600 font-medium p-2 hover:bg-slate-50 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>Tarifs</a>
            <Button variant="blue" className="w-full">Lancer l'audit gratuit</Button>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#dbeafe,transparent)]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Text Content */}
            <div className="text-left flex flex-col items-start z-10">
              <Badge variant="red" className="mb-6 px-3 py-1 text-sm rounded-full shadow-sm">
                <AlertTriangle size={14} className="mr-2" />
                Stop à l'hémorragie financière
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                Tu perds de l’argent.<br />
                <span className="relative inline-block text-slate-400 mx-2">
                  <span className="relative z-10">Pas demain.</span>
                  {/* Clean Pen Strike Effect */}
                  <svg className="absolute top-1/2 left-[-5%] w-[110%] h-[20px] -translate-y-1/2 pointer-events-none z-20 text-slate-600" viewBox="0 0 100 10" preserveAspectRatio="none">
                     <path d="M0 7 Q 50 1 100 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-blue-600 relative inline-block">
                  Aujourd’hui.
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                Pas à cause de ton équipe. Pas à cause de la météo.<br />
                <strong className="text-slate-900 font-semibold">À cause de tes achats.</strong> Et le pire : tu ne le vois pas.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full sm:w-auto">
                <Button variant="blue" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-blue-500/30 hover:-translate-y-1 transition-transform w-full sm:w-auto">
                  <Search size={20} className="mr-2" />
                  Lancer l’audit gratuit
                </Button>
                <Button variant="outline" className="h-14 px-8 text-lg rounded-full bg-white/80 backdrop-blur hover:-translate-y-1 transition-transform w-full sm:w-auto">
                  <Activity size={20} className="mr-2 text-slate-500" />
                  Voir comment ça marche
                </Button>
              </div>

              {/* Scarcity / Social Proof Block */}
              <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">J</div>
                  <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-green-600">S</div>
                  <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-orange-600">K</div>
                </div>
                <div className="text-sm">
                   <span className="font-bold text-slate-900">7 restaurateurs</span> ont fait leur audit aujourd'hui.<br/>
                   <span className="text-red-500 font-semibold flex items-center gap-1 text-xs">
                     <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                     Plus que 3 places (10 disponibles au total)
                   </span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Content - Restaurant Dashboard Composition */}
            <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000">
              <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute top-10 -left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              
              {/* Main Dashboard Card (Back Layer) */}
              <Card className="absolute w-[90%] max-w-sm h-80 bg-white shadow-2xl border-slate-200 rounded-2xl overflow-hidden z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                 <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       {/* Avatar Image */}
                       <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                          <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80" alt="Chef" className="w-full h-full object-cover" />
                       </div>
                       <span className="font-bold text-sm text-slate-700">Le Petit Bistrot</span>
                    </div>
                    <Badge variant="green" className="text-[10px] px-1.5 py-0.5">En ligne</Badge>
                 </div>
                 <div className="p-5 space-y-4">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Marge Brute</p>
                          <p className="text-2xl font-bold text-slate-900">72.4% <span className="text-green-500 text-sm font-medium">+1.2%</span></p>
                       </div>
                       <div className="h-8 w-24 bg-green-50 rounded flex items-end gap-1 px-1 pb-1">
                          <div className="w-1/4 h-2/3 bg-green-300 rounded-sm"></div>
                          <div className="w-1/4 h-1/2 bg-green-300 rounded-sm"></div>
                          <div className="w-1/4 h-3/4 bg-green-300 rounded-sm"></div>
                          <div className="w-1/4 h-full bg-green-500 rounded-sm"></div>
                       </div>
                    </div>
                    <div className="h-px bg-slate-100 w-full"></div>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                             <span className="text-slate-600">Coût Matière</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">27.6%</span>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                             <span className="text-slate-600">Achats Semaine</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">2,430 €</span>
                       </div>
                    </div>
                 </div>
              </Card>

              {/* Floating Alert Card (Front Right) */}
              <div className="absolute top-12 -right-4 md:-right-8 w-64 bg-white p-4 rounded-xl shadow-xl border border-red-100 border-l-4 border-l-red-500 z-20 animate-in slide-in-from-right-8 duration-700 delay-200">
                 <div className="flex items-start gap-3">
                    <div className="bg-red-50 p-1.5 rounded-lg shrink-0 border border-red-100">
                       <img src="https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=100&q=80" alt="Crème" className="w-8 h-8 object-cover rounded-md mix-blend-multiply" />
                    </div>
                    <div>
                       <p className="text-xs text-red-500 font-bold uppercase mb-1 flex items-center gap-1">
                         <TrendingDown size={12} /> Alerte Hausse
                       </p>
                       <p className="text-sm font-bold text-slate-900 leading-tight mb-1">Crème Liquide 35%</p>
                       <p className="text-xs text-slate-500">Metro • <span className="text-red-600 font-mono font-bold">+14%</span> vs N-1</p>
                    </div>
                 </div>
              </div>

              {/* Floating Dish Card (Bottom Left) */}
              <div className="absolute -bottom-4 -left-4 md:-left-8 w-60 bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-700 z-30 animate-in slide-in-from-left-8 duration-700 delay-500">
                 <div className="flex items-center gap-3 mb-3 border-b border-slate-700 pb-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80" alt="Burger" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Analyse Plat</span>
                 </div>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300 font-medium">Burger du Chef</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-slate-500">Coût réel</span>
                       <span className="text-lg font-bold text-white font-mono">4.12 €</span>
                    </div>
                    <Badge variant="green" className="bg-green-500/20 text-green-400 border-0 text-[10px] px-1.5">Marge OK</Badge>
                 </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* --- FLOATING FOMO SAVINGS CARD (DISSOCIATED & ATTRACTIVE) --- */}
      <section className="relative z-20 -mt-10 mb-20 px-4">
        <div className="max-w-xl mx-auto">
          <div className="relative group">
            {/* Animated Gradient Border Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-green-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-white rounded-xl py-5 px-6 text-center shadow-xl border border-slate-100">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center">
                   
                   {/* Compact Header: Live Indicator + Label */}
                   <div className="flex items-center justify-center gap-3 mb-2">
                       <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shadow-sm">
                          <div className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                          </div>
                          <span className="text-blue-600 text-[9px] font-bold uppercase tracking-widest leading-none">Live</span>
                       </div>
                       <span className="text-slate-400 text-xs font-medium">Économies générées ce mois-ci</span>
                   </div>

                   {/* Value with BLUE Gradient Text - Tighter Layout */}
                   <div className="flex items-baseline justify-center gap-1 relative">
                      <p 
                        className="text-4xl md:text-5xl font-mono font-black text-transparent bg-clip-text tracking-tighter tabular-nums leading-none"
                        style={{ backgroundImage: 'linear-gradient(135deg, #108FFF 0%, #233DFF 100%)' }}
                      >
                         {formatCurrency(totalSavedDisplay).replace('€', '')}
                      </p>
                      <span className="text-2xl text-blue-600 font-medium">€</span>
                      
                      {/* Floating +Notification */}
                      {showIncrement && (
                        <div className="absolute -right-12 top-0 text-blue-500 font-bold text-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                           +{lastIncrement}€
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- PROBLEM SECTION (REMASTERED - DARK MODE - HIGH COPYWRITING) --- */}
      <section className="py-24 bg-slate-950 relative overflow-hidden text-slate-50 pt-32">
        {/* Background Gradients for Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_800px_at_50%_-200px,#1e293b,transparent)] opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/20 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
              <AlertTriangle size={12} />
              Diagnostic Vital
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              L'inflation est volatile.<br/>
              <span className="text-slate-400">Votre gestion ne doit pas l'être.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Le problème n'est pas vos partenaires. C'est l'absence d'outils pour suivre un marché qui bouge trop vite pour être piloté à la main.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-6 md:gap-8">
            
            {/* Block 1: The Silent Hold-up (Large Left) */}
            <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-10 relative overflow-hidden group hover:border-red-900/50 transition-all duration-500">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <EyeOff size={150} className="text-white" />
               </div>
               
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-6 ring-1 ring-red-500/20">
                   <Activity size={24} />
                 </div>
                 <h3 className="text-2xl font-bold mb-4 text-white">La Fluctuation Invisible</h3>
                 <p className="text-lg text-slate-400 leading-relaxed mb-8">
                   Le marché est instable. Le saumon prend <strong className="text-red-400">0,80 €/kg</strong> cette semaine, la crème baisse, le beurre remonte.
                   <br/>Ce n'est pas de la malveillance, c'est la réalité du marché. Mais suivre 500 références à la main chaque semaine est humainement impossible.
                 </p>
                 
                 <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex gap-4 items-center">
                    <div className="h-10 w-1 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-white font-bold text-lg">La conséquence ?</p>
                      <p className="text-slate-400 text-sm">Des marges qui s'effritent silencieusement, jour après jour. <span className="text-red-400">L'inertie coûte cher.</span></p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Block 2: The Parasite Dish (Right Top) */}
            <div className="md:col-span-5 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
               
               <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                   <AlertOctagon className="text-red-500" /> Ce plat est un danger
                 </h3>
                 
                 <div className="space-y-4 font-mono text-sm relative">
                   {/* Visual "Scan" line effect */}
                   <div className="absolute top-1/2 left-0 w-full h-px bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>

                   <div className="flex justify-between border-b border-slate-700/50 pb-3">
                     <span className="text-slate-400">Plat</span>
                     <span className="text-white font-bold">Burger Signature</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-700/50 pb-3">
                     <span className="text-slate-400">Nouveau Coût Réel</span>
                     <span className="text-red-400 font-bold">5,15 € <span className="text-[10px] ml-1 bg-red-500/10 px-1 rounded">+22%</span></span>
                   </div>
                   <div className="flex justify-between border-b border-slate-700/50 pb-3">
                     <span className="text-slate-400">Prix vente</span>
                     <span className="text-slate-300">18,00 € (Inchangé)</span>
                   </div>
                   
                   <div className="pt-4 mt-2">
                     <div className="flex justify-between items-end">
                        <div className="text-left">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Impact Annuel</p>
                          <p className="text-3xl font-bold text-red-500 leading-none">-8 550 €</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-red-400/80">Juste sur ce plat.</p>
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Block 3: The Lifestyle (Bottom Left) */}
            <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:bg-slate-800/50 transition-colors group cursor-default">
               <div className="flex items-start gap-5">
                 <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                   <Clock size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold mb-3 text-white">Adieu, Dimanche soir.</h3>
                   <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                     Pendant que vos amis profitent de leur famille, vous êtes devant Excel à saisir des factures à la main.
                     <br/><br/>
                     <span className="text-white">Vous n'avez pas ouvert un restaurant pour devenir comptable à 23h le dimanche.</span> Automatisez ce qui peut l'être.
                   </p>
                 </div>
               </div>
            </div>

            {/* Block 4: The Power Dynamic (Bottom Right) */}
            <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:bg-slate-800/50 transition-colors group cursor-default">
               <div className="flex items-start gap-5">
                 <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                   <Handshake size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold mb-3 text-white">Devenez un Partenaire Pro</h3>
                   <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                     Les fournisseurs respectent les gestionnaires qui connaissent leurs chiffres. Ne négociez plus à l'intuition.
                     <br/><br/>
                     <span className="text-white">Parlez d'égal à égal.</span> Avec des données précises, la relation devient saine, professionnelle et factuelle.
                   </p>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (INTERACTIVE) --- */}
      <section id="fonctionnement" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <Badge variant="secondary" className="mb-4">Simple & Rapide</Badge>
             <h2 className="text-4xl font-bold text-slate-900 mb-4">Comment ça marche (vraiment)</h2>
             <p className="text-lg text-slate-600">3 étapes. 2 minutes. Zéro excuse.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Interactive Steps List */}
            <div className="relative space-y-8" onMouseEnter={() => setIsHoveringSteps(true)} onMouseLeave={() => setIsHoveringSteps(false)}>
              
              {/* Connector Line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100 z-0" />
              
              {steps.map((step, index) => {
                const isActive = activeStep === step.id;
                
                return (
                  <div 
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`relative z-10 cursor-pointer p-6 rounded-2xl transition-all duration-500 border group ${isActive ? 'bg-white border-blue-100 shadow-xl shadow-blue-900/5 scale-105' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex gap-6 items-start">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg transition-all duration-500 relative overflow-hidden ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-500'}`}>
                         <span className="relative z-10">{step.icon}</span>
                         {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                       </div>
                       <div className="flex-1">
                         <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{step.title}</h3>
                         <p className={`leading-relaxed transition-colors duration-300 ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>{step.description}</p>
                       </div>
                       {isActive && (
                         <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-2xl animate-in slide-in-from-right-full duration-300" />
                       )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Dynamic Visual */}
            <div className="relative h-[600px] w-full flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-slate-50 rounded-3xl -z-10" />
               <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-50 -z-10"></div>
               
               <div className="relative w-full max-w-md h-[500px]">
                  
                  {/* Step 0: Upload Visual (Magnetic Levitation) */}
                  {activeStep === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                         <div className="relative group cursor-pointer w-full max-w-sm">
                            {/* Animated Background Rings */}
                            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-700 animate-pulse"></div>
                            
                            <Card className="relative p-10 border-2 border-dashed border-blue-200 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500 group-hover:border-blue-400 group-hover:scale-[1.02]">
                                <div className="relative mb-8">
                                   <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                   <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform transition-transform duration-700 group-hover:-translate-y-4 group-hover:rotate-3">
                                      <Upload size={40} className="animate-bounce" />
                                   </div>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">Déposez vos factures</h4>
                                <p className="text-slate-500 mb-6">ou transférez-les par email</p>
                                
                                {/* Email Pill */}
                                <div className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200 flex items-center gap-2 text-xs font-mono text-slate-600">
                                   <Mail size={12} />
                                   factures@mon-resto.ravy.fr
                                </div>
                            </Card>

                            {/* Floating Elements */}
                            <div className="absolute -right-8 top-20 bg-white p-3 rounded-xl shadow-lg border border-slate-100 animate-[bounce_3s_infinite] flex gap-2 items-center">
                               <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600"><FileText size={16}/></div>
                               <span className="text-xs font-bold text-slate-700">Metro.pdf</span>
                            </div>
                            <div className="absolute -left-8 bottom-20 bg-white p-3 rounded-xl shadow-lg border border-slate-100 animate-[bounce_4s_infinite] flex gap-2 items-center animation-delay-1000">
                               <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Mail size={16}/></div>
                               <span className="text-xs font-bold text-slate-700">Reçu</span>
                            </div>
                         </div>
                      </div>
                  )}

                  {/* Step 1: Analyze Visual (Laser Scanner) */}
                  {activeStep === 1 && (
                      <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                         <div className="relative w-[340px] bg-white rounded-t-lg shadow-2xl border-x border-t border-slate-200 overflow-hidden h-[450px]">
                             {/* Receipt Header */}
                             <div className="bg-slate-50 p-4 border-b border-slate-100 text-center">
                                <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-2"></div>
                                <div className="h-2 w-24 bg-slate-200 rounded mx-auto mb-1"></div>
                                <div className="h-2 w-16 bg-slate-200 rounded mx-auto"></div>
                             </div>

                             {/* Receipt Body */}
                             <div className="p-6 space-y-6 relative">
                                {/* Laser Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.6)] z-20 animate-[scan_2.5s_linear_infinite]" />
                                
                                {/* Items */}
                                {[
                                  { name: "Mozzarella Di Bufala", price: "45.20", hl: false },
                                  { name: "Crème Liquide 35%", price: "22.80", hl: true, alert: true },
                                  { name: "Farine T55 25kg", price: "18.50", hl: false },
                                  { name: "Jambon Parme DOP", price: "64.90", hl: true },
                                  { name: "Huile Olive Vierge", price: "32.10", hl: false },
                                ].map((item, i) => (
                                   <div key={i} className={`flex justify-between items-center p-2 rounded transition-colors duration-500 ${item.hl ? 'bg-blue-50/50' : ''}`} style={{animationDelay: `${i * 0.4}s`}}>
                                      <div className="flex flex-col gap-1">
                                         <span className={`text-sm font-medium ${item.hl ? 'text-slate-900' : 'text-slate-400'}`}>{item.name}</span>
                                         <div className={`h-1.5 w-12 rounded ${item.hl ? 'bg-blue-200' : 'bg-slate-100'}`}></div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {item.alert && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                                        <span className={`font-mono text-sm ${item.hl ? 'text-blue-600 font-bold' : 'text-slate-300'}`}>{item.price} €</span>
                                      </div>
                                   </div>
                                ))}
                             </div>

                             {/* Receipt Jagged Bottom */}
                             <div className="absolute bottom-0 left-0 w-full h-4 bg-white" style={{clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
                             
                             {/* AI Processing Badge */}
                             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500 delay-1000">
                                <ScanLine size={14} className="text-blue-400 animate-spin-slow" />
                                Extraction : 100%
                             </div>
                         </div>
                      </div>
                  )}

                  {/* Step 2: Alert/SMS Visual (Dynamic Notification) */}
                  {activeStep === 2 && (
                      <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                         {/* Phone Mockup */}
                         <div className="bg-slate-900 rounded-[3rem] p-3 shadow-2xl w-[300px] border-4 border-slate-800 relative ring-1 ring-white/20 h-[500px] overflow-hidden">
                            
                            {/* Wallpaper/App BG */}
                            <div className="absolute inset-0 bg-slate-100 z-0"></div>

                            {/* Status Bar */}
                            <div className="absolute top-0 left-0 right-0 h-8 z-20 flex justify-between px-6 pt-3">
                               <span className="text-[10px] font-bold text-slate-800">14:02</span>
                               <div className="flex gap-1">
                                  <div className="w-3 h-3 bg-slate-800 rounded-full opacity-20"></div>
                                  <div className="w-3 h-3 bg-slate-800 rounded-full opacity-20"></div>
                               </div>
                            </div>
                            
                            {/* Dynamic Island / Notch */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30"></div>

                            {/* Notification Banner Drop */}
                            <div className="absolute top-12 left-4 right-4 z-40 perspective-1000">
                               <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 animate-in slide-in-from-top-12 fade-in duration-700 cubic-bezier(0.16, 1, 0.3, 1)">
                                  <div className="flex gap-3">
                                     <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                                        <div className="font-bold text-xs">R</div>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                           <span className="font-bold text-sm text-slate-900">RAVY</span>
                                           <span className="text-[10px] text-slate-400">Maintenant</span>
                                        </div>
                                        <p className="text-xs text-slate-700 font-medium leading-tight">
                                           🚨 Alerte Prix : La Crème 35% a pris <span className="text-red-500 font-bold">+14%</span>.
                                        </p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* App Interface (Behind) */}
                            <div className="absolute inset-0 pt-24 px-4 z-10 flex flex-col gap-3">
                               <div className="w-full h-32 bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse delay-75"></div>
                               <div className="w-full h-20 bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse delay-150"></div>
                               <div className="w-full h-20 bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse delay-200"></div>
                            </div>

                            {/* Bottom Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-slate-300 rounded-full z-20"></div>
                         </div>
                      </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SIMULATOR SECTION --- */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Controls */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
                <Calculator size={12} />
                Simulateur de rentabilité
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Découvrez combien de marge vous pouvez récupérer
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Nos utilisateurs augmentent leur marge nette de 5% en moyenne en optimisant leurs achats et en évitant les erreurs.
                <br/>Utilisez le simulateur pour voir l'impact sur votre établissement.
              </p>

              <div className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Votre Chiffre d'Affaires Mensuel</label>
                    <span className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(turnover)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10000" 
                    max="200000" 
                    step="5000" 
                    value={turnover} 
                    onChange={(e) => setTurnover(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>10 k€</span>
                    <span>200 k€+</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 italic">
                  *Basé sur une économie moyenne constatée de 5% sur le volume d'achat global (environ 30% du CA).
                </p>
              </div>
            </div>

            {/* Right: Results Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl blur-2xl opacity-60 transform rotate-2"></div>
              
              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-8 md:p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-50 shadow-sm">
                  <Banknote size={32} />
                </div>
                
                <h3 className="text-slate-500 font-medium uppercase tracking-widest text-sm mb-2">Gain estimé par an</h3>
                <p className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-4 tracking-tight tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
                  {formatCurrency(estimatedGainYearly)}
                </p>
                
                <div className="flex items-center gap-2 mb-8 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  <ArrowUpRight size={16} className="text-green-600" />
                  <span className="text-green-700 font-bold text-sm">+{formatCurrency(estimatedGainMonthly)} / mois</span>
                </div>

                <div className="w-full border-t border-slate-100 pt-8 mt-2">
                   <p className="text-slate-600 mb-6">C'est l'équivalent de :</p>
                   <div className="grid grid-cols-2 gap-4 text-left">
                     <div className="flex items-center gap-3">
                       <CheckCircle2 className="text-blue-500 flex-shrink-0" size={18} />
                       <span className="text-sm font-medium text-slate-800">1 salaire annuel chargé</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <CheckCircle2 className="text-blue-500 flex-shrink-0" size={18} />
                       <span className="text-sm font-medium text-slate-800">Vos prochaines vacances</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <CheckCircle2 className="text-blue-500 flex-shrink-0" size={18} />
                       <span className="text-sm font-medium text-slate-800">Investissement matériel</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <CheckCircle2 className="text-blue-500 flex-shrink-0" size={18} />
                       <span className="text-sm font-medium text-slate-800">Trésorerie de sécurité</span>
                     </div>
                   </div>
                   
                   <Button variant="blue" className="w-full mt-8 h-12 text-lg font-bold shadow-lg shadow-blue-600/20">
                     Récupérer cette marge
                   </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS (REMASTERED) --- */}
      <section id="temoignages" className="py-24 bg-white border-y border-slate-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Ils ont repris le contrôle</h2>
            <div className="flex justify-center items-center gap-2">
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <span className="text-slate-600 font-medium">4.9/5 par des restaurateurs indépendants</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 relative hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col h-full">
              <Quote className="absolute top-6 right-6 text-slate-200" size={40} />
              
              <div className="mb-6 flex items-center gap-3">
                 <Badge variant="green" className="bg-green-100 text-green-700 border-green-200">
                   <TrendingUp size={12} className="mr-1" />
                   -4% Coût Matière
                 </Badge>
              </div>

              <p className="text-slate-700 italic text-lg leading-relaxed mb-8 flex-grow">
                "Le pire, ce n’est pas la perte. C’est de réaliser que ça durait depuis des mois. Ravy a stoppé l'hémorragie nette."
              </p>

              <div className="mt-auto flex items-center gap-4 border-t border-slate-200 pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg ring-4 ring-white">J</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">Julien P.</p>
                    <CheckCircle2 size={14} className="text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Le Bistrot des Halles</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 (Featured) */}
            <div className="bg-white border-2 border-blue-100 rounded-2xl p-8 relative shadow-2xl shadow-blue-900/5 flex flex-col h-full transform md:-translate-y-4">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Top Avis
              </div>
              <Quote className="absolute top-6 right-6 text-blue-50" size={40} />
              
              <div className="mb-6 flex items-center gap-3">
                 <Badge variant="green" className="bg-green-100 text-green-700 border-green-200">
                   <Banknote size={12} className="mr-1" />
                   4 000 € économisés
                 </Badge>
              </div>

              <p className="text-slate-800 font-medium text-lg leading-relaxed mb-8 flex-grow">
                "La première alerte m’a fait mal au coeur. La deuxième m’a soulagée. Je contrôle enfin mon business, je dors mieux."
              </p>

              <div className="mt-auto flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600 text-lg ring-4 ring-slate-50">S</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">Sarah L.</p>
                    <CheckCircle2 size={14} className="text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">La Brasserie du Coin</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 relative hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col h-full">
              <Quote className="absolute top-6 right-6 text-slate-200" size={40} />
              
              <div className="mb-6 flex items-center gap-3">
                 <Badge variant="blue" className="bg-blue-100 text-blue-700 border-blue-200">
                   <Handshake size={12} className="mr-1" />
                   Négo réussie
                 </Badge>
              </div>

              <p className="text-slate-700 italic text-lg leading-relaxed mb-8 flex-grow">
                "J’ai arrêté de négocier à l’aveugle avec mes fournisseurs. J'arrive avec des chiffres précis, ils s'alignent direct."
              </p>

              <div className="mt-auto flex items-center gap-4 border-t border-slate-200 pt-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-lg ring-4 ring-white">K</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">Karim B.</p>
                    <CheckCircle2 size={14} className="text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Pizza Roma</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMPARISON --- */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">L'ancien monde vs. La méthode Ravy</h2>
            <p className="text-lg text-slate-600">Pourquoi continuer à gérer votre restaurant comme en 1990 ?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center relative">
            
            {/* VS Badge (Desktop only) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 bg-white rounded-full items-center justify-center font-black text-slate-300 border border-slate-200 shadow-sm">
              VS
            </div>

            {/* Old World - The Pain */}
            <div className="bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-slate-200/50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
              
              <div className="flex items-center gap-3 mb-8 opacity-70">
                <div className="p-2 bg-slate-200 rounded-lg">
                  <Clock size={20} className="text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-500 uppercase tracking-wide">Avant</h3>
              </div>

              <ul className="space-y-8 relative z-10">
                <li className="flex gap-4">
                  <div className="mt-1">
                    <XCircle size={24} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-lg">Saisie manuelle interminable</p>
                    <p className="text-sm text-slate-500">Le dimanche soir, fatigué, avec des erreurs de frappe inévitables.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1">
                    <XCircle size={24} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-lg">Fiches techniques "statiques"</p>
                    <p className="text-sm text-slate-500">Calculées une fois en 2023, jamais mises à jour depuis. Faux coûts.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1">
                    <XCircle size={24} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-lg">Découverte tardive</p>
                    <p className="text-sm text-slate-500">Vous réalisez que vous avez perdu de l'argent quand le comptable appelle. Trop tard.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* New World - The Solution (Highlighted) */}
            <div className="bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-800 relative overflow-hidden shadow-2xl shadow-blue-900/20 transform md:scale-105 z-10">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-blue-600/10 via-transparent to-transparent"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>

               <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/30">
                  <Zap size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wide">Avec RAVY</h3>
              </div>

              <ul className="space-y-8 relative z-10">
                <li className="flex gap-4">
                  <div className="mt-1 bg-green-500/20 p-1 rounded-full h-fit">
                    <CheckCircle2 size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Import 100% Automatisé</p>
                    <p className="text-sm text-slate-400">Photo, PDF ou transfert de mail. L'IA extrait tout en secondes.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-green-500/20 p-1 rounded-full h-fit">
                    <CheckCircle2 size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Marges Réelles & Dynamiques</p>
                    <p className="text-sm text-slate-400">Vos recettes se mettent à jour seules à chaque nouvelle facture.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-green-500/20 p-1 rounded-full h-fit">
                    <CheckCircle2 size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Alertes Prédictives</p>
                    <p className="text-sm text-slate-400">Notifié par SMS avant de servir un plat qui ne marge plus.</p>
                  </div>
                </li>
              </ul>
            </div>

          </div>
          <p className="text-center mt-12 text-slate-500 font-medium">Ne subissez plus votre restaurant. Pilotez-le.</p>
        </div>
      </section>

      {/* --- PRICING (REMASTERED) --- */}
      <section id="tarifs" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Investissement vs Dépense</h2>
             <p className="text-slate-600 text-lg">Ne regardez pas ce que ça coûte. Regardez ce que ça rapporte.</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start mb-24">
            
            {/* Apéro */}
            <Card className="p-8 flex flex-col hover:border-slate-300 transition-colors h-full bg-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={100} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Apéro</h3>
              <p className="text-sm text-slate-500 mb-6">Pour arrêter l'hémorragie.</p>
              
              <div className="my-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">49 €</span>
                  <span className="text-slate-500 ml-1">/ mois</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                  <Zap size={10} /> Rentabilisé en 1 jour
                </div>
                <p className="text-xs text-slate-400 mt-2">Moins cher qu'un café/jour</p>
              </div>

              <div className="space-y-4 mb-8 flex-1 relative z-10">
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700"><strong>Alertes SMS</strong> anti-hausse</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Suivi <strong>automatique</strong> des achats</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Historique complet des prix</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-auto relative z-10">
                Sécuriser mes marges
              </Button>
            </Card>

            {/* Plat (Highlight) */}
            <Card className="p-8 flex flex-col relative border-blue-200 shadow-2xl shadow-blue-900/10 ring-1 ring-blue-500 h-full transform lg:-translate-y-4 bg-white overflow-hidden">
              <div className="absolute top-0 right-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md z-20">
                Recommandé
              </div>
              
              <h3 className="text-2xl font-bold text-blue-600 mb-2">Plat</h3>
              <p className="text-sm text-slate-500 mb-6">Pour optimiser chaque assiette.</p>

              <div className="my-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-slate-900">89 €</span>
                  <span className="text-slate-500 ml-1">/ mois</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  <Zap size={10} /> Rentabilisé en 48h
                </div>
                <p className="text-xs text-slate-400 mt-2">Le prix d'un service raté</p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-900 font-medium">Tout du pack Apéro</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Fiches recettes <strong>dynamiques</strong></span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Calcul de <strong>rentabilité réelle</strong></span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Analyse des écarts théoriques</span>
                </div>
              </div>
              
              <Button variant="blue" className="w-full py-6 text-base shadow-lg shadow-blue-600/20 mt-auto">
                Commencer à gagner
              </Button>
            </Card>

            {/* Menu */}
            <Card className="p-8 flex flex-col hover:border-slate-300 transition-colors h-full bg-white relative overflow-hidden group">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Menu</h3>
              <p className="text-sm text-slate-500 mb-6">Pour piloter comme un DAF.</p>
              
              <div className="my-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">149 €</span>
                  <span className="text-slate-500 ml-1">/ mois</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                  <Zap size={10} /> Rentabilité maximale
                </div>
                <p className="text-xs text-slate-400 mt-2">Pour les pros exigeants</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Tout du pack Plat</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Pilotage multi-établissements</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Accompagnement <strong>dédié VIP</strong></span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full mt-auto">
                Contacter l'équipe
              </Button>
            </Card>

          </div>

          {/* Sexy Question Block */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl transform rotate-1 opacity-10 blur-xl"></div>
            <div className="relative bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden">
              {/* Decorator */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>
              
              <div className="relative z-10 text-left md:w-3/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-700 border border-blue-100">
                    <Calculator size={20} />
                  </div>
                  <span className="font-bold text-blue-700 text-sm uppercase tracking-wider">Le calcul est vite fait</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
                  Combien vous coûte un mois <span className="text-red-500 relative whitespace-nowrap">
                    sans RAVY ?
                    <svg className="absolute w-full h-3 bottom-0 left-0 text-red-200/50 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="12" fill="none" />
                    </svg>
                  </span>
                </h3>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Souvent bien plus que l’abonnement. <br/>
                  <span className="text-slate-800 font-medium">Parfois, c'est ce qui fait la différence entre une année bénéficiaire et une année à perte.</span>
                </p>
              </div>

              <div className="relative z-10 md:w-2/5 flex justify-center">
                 <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl transform md:rotate-3 border border-slate-700 w-full max-w-xs relative group hover:rotate-0 transition-transform duration-300">
                    <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">Perte sèche</div>
                    <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-4">
                      <span className="text-slate-400 text-sm">Coût de l'inaction</span>
                      <AlertTriangle size={16} className="text-orange-400" />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span className="text-slate-400">Erreurs prix</span>
                         <span className="text-red-400 font-mono">-150€</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-slate-400">Hausses ratées</span>
                         <span className="text-red-400 font-mono">-220€</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-slate-400">Temps perdu</span>
                         <span className="text-red-400 font-mono">-180€</span>
                       </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                       <span className="font-bold text-white">TOTAL / MOIS</span>
                       <span className="font-bold text-xl text-red-500 bg-red-500/10 px-2 py-1 rounded">-550 €</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">On a devancé vos questions</h2>
            <p className="text-slate-600">Tout ce qui pourrait vous faire hésiter est réglé.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-2xl bg-white overflow-hidden hover:border-blue-200 transition-colors duration-300">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className={`font-bold text-lg ${activeFaq === index ? 'text-blue-600' : 'text-slate-900'}`}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`text-slate-400 transition-transform duration-300 ${activeFaq === index ? 'rotate-180 text-blue-600' : ''}`}
                    size={20}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    activeFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-6 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
             <div className="flex justify-center mb-4">
                <div className="p-3 bg-white rounded-full shadow-sm">
                   <HelpCircle className="text-blue-600" size={24} />
                </div>
             </div>
             <p className="text-slate-900 font-medium mb-2">Vous avez une autre question ?</p>
             <p className="text-slate-500 text-sm mb-4">Notre équipe d'anciens restaurateurs vous répond.</p>
             <a href="mailto:hello@ravy.fr" className="text-blue-600 font-bold hover:underline">Parler à un fondateur &rarr;</a>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 bg-slate-950 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_-100px,#3b82f620,transparent)]"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight leading-tight">Dernière chose.</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Tu peux continuer à travailler à l’aveugle,<br/> ou voir enfin ce qui se passe vraiment.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="blue" className="h-14 px-8 text-lg font-bold shadow-blue-500/20 shadow-xl rounded-full hover:scale-105 transition-transform">
              Lancer l’audit gratuit maintenant
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg font-medium bg-transparent text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white rounded-full hover:border-slate-500 hover:scale-105 transition-transform">
              Voir ce que je perds aujourd’hui
            </Button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-slate-950 border-t border-slate-900 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">R</div>
              <p className="font-semibold text-slate-400">RAVY</p>
          </div>
          <p>© {new Date().getFullYear()} RAVY. La vérité sur vos marges.</p>
          <div className="flex gap-8">
             <a href="#" className="hover:text-slate-300 transition-colors">Mentions légales</a>
             <a href="#" className="hover:text-slate-300 transition-colors">Confidentialité</a>
             <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;