import { useState, useEffect, useRef } from "react";

// ============================================
// SHARPBID ESTIMATING — Full Business Website
// Bilingual EN/FR | Canada-Wide | SEO-Optimized
// ============================================

const CONTENT = {
  en: {
    nav: { services: "Services", about: "About", industries: "Industries", faq: "FAQ", contact: "Get a Quote" },
    hero: {
      badge: "Canada's On-Demand Estimating Partner",
      headline: "Senior-Level Estimates.",
      headlineAccent: "Zero Overhead.",
      sub: "10+ years of commercial, residential, industrial & civil estimating — available on-demand for Canadian contractors who need accuracy without the full-time salary.",
      cta: "Request a Free Consultation",
      ctaSec: "See Our Services",
      stats: [
        { num: "10+", label: "Years Experience" },
        { num: "All", label: "Sectors Covered" },
        { num: "48hr", label: "Typical Turnaround" },
        { num: "Coast", label: "to Coast" },
      ],
    },
    pain: {
      tag: "Sound Familiar?",
      title: "The Estimating Problem Most GCs Won't Talk About",
      items: [
        { icon: "💸", title: "Can't Justify $130K+ for a Full-Time Estimator", desc: "You need senior-level accuracy, but the salary, benefits, and software costs don't make sense at your volume. Why pay year-round for seasonal demand?" },
        { icon: "🔥", title: "Your Estimator Just Left — Bids Are Piling Up", desc: "You're stuck between rushing bids and missing deadlines. You need bridge coverage now, not after a 6-week hiring process." },
        { icon: "📉", title: "Losing Bids Because Numbers Are Off", desc: "Inaccurate estimates mean you're either leaving money on the table or pricing yourself out of work entirely." },
        { icon: "⏰", title: "Drowning in Tender Invitations", desc: "You're turning down opportunities from coast to coast because you simply don't have the estimating bandwidth to bid on everything." },
      ],
      closer: "What if you had a senior estimator on call — anywhere in Canada — without the full-time commitment?",
    },
    services: {
      tag: "Services",
      title: "Estimating Solutions That Fit Your Business",
      items: [
        {
          icon: "📋", title: "Full Bid Estimates",
          desc: "Complete tender-ready estimates from takeoff to final bid. I handle the entire process so you can focus on building — whether you're bidding in Vancouver, Toronto, Calgary, or Halifax.",
          details: ["Quantity takeoffs (Bluebeam, PlanSwift, On-Screen Takeoff)", "Material & labour pricing with regional cost data", "Sub-trade analysis & bid leveling", "Bid compilation & submission support"],
          price: "From $1,500",
        },
        {
          icon: "🔄", title: "Monthly Retainer",
          desc: "Dedicated estimating hours every month. Like having a senior estimator on staff — without the overhead, the benefits, or the downtime.",
          details: ["10, 20, or 40 hours/month packages", "Priority turnaround on all projects", "Consistent availability — no scrambling", "Predictable monthly cost you can budget for"],
          price: "From $1,000/mo",
        },
        {
          icon: "🏗️", title: "Budget & Conceptual Estimates",
          desc: "Early-stage cost planning for developers, owners, and design teams making critical go/no-go decisions on projects across Canada.",
          details: ["Pre-construction budgets", "Feasibility cost analysis", "Class D through Class A estimates", "Cost comparison & value engineering studies"],
          price: "From $2,000",
        },
        {
          icon: "🔍", title: "Estimate Review & Audit",
          desc: "Independent second opinion on estimates prepared by others. Catch errors before they cost you real money on the job site.",
          details: ["Line-by-line estimate verification", "Scope gap identification", "Risk & contingency analysis", "Written audit report with recommendations"],
          price: "From $1,000",
        },
        {
          icon: "📐", title: "Quantity Takeoff Services",
          desc: "Detailed material quantities from drawings — you handle the pricing, I handle the math. Available for any project, any province.",
          details: ["Digital takeoffs from PDF/CAD drawings", "Bluebeam & PlanSwift formatted deliverables", "CSI MasterFormat organization", "Custom format to match your systems"],
          price: "From $500/scope",
        },
        {
          icon: "⚡", title: "Bid Day Support",
          desc: "Last-minute scope reviews, sub-trade leveling, and bid compilation when the clock is ticking and there's no room for error.",
          details: ["Sub-bid analysis & comparison", "Scope verification & gap checks", "Final number compilation", "Rush delivery — same day available"],
          price: "From $150/hr",
        },
      ],
    },
    value: {
      tag: "The Math",
      title: "Why Outsourcing Beats Hiring",
      left: {
        label: "Full-Time Estimator",
        total: "$155,000+/yr",
        items: ["Salary: $95,000 – $130,000", "Benefits & CPP/EI: $15,000+", "Software licenses: $5,000+", "Office space & equipment: $10,000+", "Paid when there's no work: Yes", "Training & turnover risk: High"],
      },
      right: {
        label: "SharpBid",
        total: "From $1,000/mo",
        items: ["Pay only for what you need", "Senior-level expertise included", "All software costs covered by me", "No overhead, no office, no equipment", "Scale up or down anytime", "No turnover risk — always available"],
      },
      savings: "Potential savings: $100,000+ per year",
    },
    industries: {
      tag: "Industries",
      title: "Every Sector. Every Province.",
      sub: "Serving general contractors, subcontractors, developers, and owners from British Columbia to Newfoundland.",
      items: [
        { icon: "🏢", name: "Commercial & Institutional", desc: "Office towers, schools, hospitals, government facilities, retail, restaurants — from LEED-certified builds to tenant improvements." },
        { icon: "🏠", name: "Residential", desc: "Custom homes, multi-family, renovations, additions, laneway & infill housing across Canadian markets." },
        { icon: "🏭", name: "Industrial", desc: "Warehouses, manufacturing plants, processing facilities, cold storage, distribution centres." },
        { icon: "🛣️", name: "Civil & Sitework", desc: "Roads, utilities, grading, earthwork, retaining walls, site services, municipal infrastructure." },
        { icon: "🧱", name: "Concrete & Structural", desc: "Foundations, slabs, walls, columns, formwork, structural steel connections." },
        { icon: "🪟", name: "Building Envelope", desc: "Curtain wall, cladding, roofing, waterproofing, insulation systems for all Canadian climates." },
      ],
    },
    regions: {
      tag: "Coverage",
      title: "Serving Contractors Across Canada",
      areas: [
        { region: "British Columbia", cities: "Vancouver, Victoria, Kelowna, Surrey" },
        { region: "Alberta", cities: "Calgary, Edmonton, Red Deer, Lethbridge" },
        { region: "Saskatchewan & Manitoba", cities: "Saskatoon, Regina, Winnipeg" },
        { region: "Ontario", cities: "Toronto, Ottawa, Hamilton, Mississauga" },
        { region: "Quebec", cities: "Montréal, Québec City, Laval, Gatineau" },
        { region: "Atlantic Canada", cities: "Halifax, Saint John, Moncton, St. John's" },
      ],
    },
    about: {
      tag: "About",
      title: "A Senior Estimator in Your Corner",
      p1: "With over a decade of hands-on estimating experience at leading general contractors, I've priced hundreds of projects across every sector — from $50K renovations to $50M+ institutional builds.",
      p2: "I started SharpBid because too many good contractors across Canada are losing bids — not because they can't build, but because they don't have the estimating firepower to compete. Small and mid-size GCs deserve the same quality estimates as the big firms, no matter what province they're in.",
      p3: "When you work with me, you're getting a senior estimator who's been in the trenches — not a junior learning on your dime.",
      highlights: [
        "10+ years at top-tier general contractors",
        "Expert in Bluebeam, PlanSwift, On-Screen Takeoff & Excel",
        "Full GC/prime estimates across all CSI divisions",
        "Based in Vancouver, serving all of Canada remotely",
      ],
    },
    faq: {
      tag: "FAQ",
      title: "Questions Contractors Ask",
      items: [
        { q: "How fast can you turn around an estimate?", a: "Typical turnaround is 48-72 hours for small to mid-size projects. Rush and bid-day support available with 24-hour notice. Retainer clients always get priority scheduling." },
        { q: "What software do you use?", a: "Bluebeam Revu, PlanSwift, On-Screen Takeoff, and advanced Excel. I deliver in whatever format your team uses — CSI MasterFormat, custom cost codes, or your own templates." },
        { q: "Can you work with contractors outside BC?", a: "Absolutely. I serve contractors across all provinces and territories. Everything is done digitally — drawings, specs, estimates, and communication. Time zones have never been a problem." },
        { q: "How do you handle confidentiality?", a: "Every engagement starts with a confidentiality agreement. Your project data, pricing, and sub-trade information stays strictly between us. Period." },
        { q: "How do you price for different regions?", a: "I use region-specific cost data and local material/labour rates for wherever your project is located. Whether it's Vancouver, Toronto, Montréal, or Fort McMurray — your estimate reflects local market conditions." },
        { q: "What if my estimate needs revisions?", a: "One round of revisions is included with every estimate. Addenda and scope changes during the bid period are handled promptly — that's part of the service." },
        { q: "Do you carry insurance?", a: "Yes. I carry professional errors & omissions (E&O) insurance and general liability coverage for your peace of mind." },
        { q: "What's the minimum project size?", a: "No hard minimum. I've done quick budget checks for $50K renos and full estimates for $50M+ institutional projects. Let's talk about your specific needs." },
        { q: "How does the retainer model work?", a: "You purchase a block of hours (10, 20, or 40/month). Use them for any estimating need — bids, budgets, takeoffs, reviews. You get priority access and a locked-in rate." },
        { q: "Offrez-vous des services en français?", a: "Oui! Je peux fournir des estimations et communiquer en français pour les projets fédéraux et les clients au Québec. N'hésitez pas à me contacter en français." },
      ],
    },
    contact: {
      tag: "Start Here",
      title: "Get Your Free Consultation",
      sub: "Tell me about your project. I'll review your needs and respond within 4 business hours — anywhere in Canada. Or call (604) 245-4344.",
      fields: {
        name: "Full Name", email: "Email Address", company: "Company Name", phone: "Phone Number",
        province: "Province / Territory", type: "Project Type", budget: "Estimated Project Value",
        timeline: "Bid Deadline / Timeline", details: "Project Details", submit: "Send Request",
        typeOptions: ["Select project type...", "Full Bid Estimate", "Budget / Conceptual Estimate", "Quantity Takeoff", "Estimate Review / Audit", "Bid Day Support", "Monthly Retainer", "Other / Not Sure"],
        budgetOptions: ["Select range...", "Under $500K", "$500K – $1M", "$1M – $5M", "$5M – $10M", "$10M – $25M", "$25M+", "Not sure yet"],
        provinceOptions: ["Select province...", "British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario", "Quebec", "New Brunswick", "Nova Scotia", "PEI", "Newfoundland & Labrador", "Northwest Territories", "Yukon", "Nunavut", "Multi-Province / National"],
      },
      promise: "No spam. No sales pitch. Just a straight conversation about your project.",
    },
    lead: {
      title: "Free Guide",
      headline: "The True Cost of Not Having an Estimator",
      sub: "A breakdown of what bad estimates actually cost Canadian contractors — and the smarter alternative.",
      cta: "Download Free Guide",
      placeholder: "Enter your email",
      ty: "Check your inbox!",
    },
    footer: {
      tagline: "Senior-level estimating for Canadian contractors who build smart.",
      col1: "Services", col2: "Company", col3: "Regions",
      copy: "© 2026 SharpBid Estimating. Based in Vancouver, BC. Serving all of Canada.",
      phone: "(604) 245-4344",
      email: "info@sharpbid.ca",
      links1: ["Full Bid Estimates", "Monthly Retainers", "Budget Estimates", "Estimate Audits", "Quantity Takeoffs", "Bid Day Support"],
      links2: ["About", "Industries", "FAQ", "Blog", "Contact"],
      links3: ["British Columbia", "Alberta", "Ontario", "Quebec", "Atlantic Canada", "Prairies & North"],
    },
  },
  fr: {
    nav: { services: "Services", about: "À propos", industries: "Industries", faq: "FAQ", contact: "Soumission" },
    hero: {
      badge: "Partenaire d'estimation sur demande au Canada",
      headline: "Estimations de niveau senior.",
      headlineAccent: "Zéro frais généraux.",
      sub: "Plus de 10 ans d'expérience en estimation commerciale, résidentielle, industrielle et civile — disponible sur demande pour les entrepreneurs canadiens qui recherchent la précision sans le salaire à temps plein.",
      cta: "Consultation gratuite",
      ctaSec: "Voir nos services",
      stats: [
        { num: "10+", label: "Ans d'expérience" },
        { num: "Tous", label: "Secteurs couverts" },
        { num: "48h", label: "Délai typique" },
        { num: "D'un", label: "Océan à l'autre" },
      ],
    },
    pain: {
      tag: "Ça vous dit quelque chose?",
      title: "Le problème d'estimation dont personne ne parle",
      items: [
        { icon: "💸", title: "130 000$+ pour un estimateur à temps plein?", desc: "Vous avez besoin de précision, mais le salaire, les avantages et les logiciels ne se justifient pas à votre volume." },
        { icon: "🔥", title: "Votre estimateur vient de partir", desc: "Les soumissions s'accumulent et vous êtes coincé entre précipiter les offres et manquer les échéances." },
        { icon: "📉", title: "Vous perdez des contrats", desc: "Des chiffres imprécis signifient que vous laissez de l'argent sur la table ou que vous vous excluez des projets." },
        { icon: "⏰", title: "Trop d'invitations à soumissionner", desc: "Vous refusez des opportunités d'un océan à l'autre parce que vous n'avez tout simplement pas la capacité." },
      ],
      closer: "Et si vous aviez un estimateur senior sur appel — partout au Canada — sans l'engagement à temps plein?",
    },
    services: {
      tag: "Services",
      title: "Solutions d'estimation adaptées à votre entreprise",
      items: [
        { icon: "📋", title: "Estimations complètes", desc: "Estimations prêtes pour soumission, du relevé de quantités à l'offre finale. Que vous soumissionniez à Montréal, Toronto ou Vancouver.", details: ["Relevés de quantités (Bluebeam, PlanSwift)", "Prix des matériaux et main-d'œuvre avec données régionales", "Analyse des sous-traitants", "Compilation et support de soumission"], price: "À partir de 1 500$" },
        { icon: "🔄", title: "Forfait mensuel", desc: "Heures d'estimation dédiées chaque mois. Comme avoir un estimateur senior — sans les frais.", details: ["Forfaits 10, 20 ou 40 heures/mois", "Délai prioritaire", "Disponibilité constante", "Coût mensuel prévisible"], price: "À partir de 1 000$/mois" },
        { icon: "🏗️", title: "Budgets préliminaires", desc: "Planification des coûts en phase préliminaire pour promoteurs et propriétaires partout au Canada.", details: ["Budgets de pré-construction", "Analyse de faisabilité", "Estimations classe D à classe A", "Études comparatives"], price: "À partir de 2 000$" },
        { icon: "🔍", title: "Audit d'estimation", desc: "Deuxième avis indépendant sur les estimations préparées par d'autres.", details: ["Vérification ligne par ligne", "Identification des lacunes", "Analyse des risques", "Rapport d'audit écrit"], price: "À partir de 1 000$" },
        { icon: "📐", title: "Relevés de quantités", desc: "Quantités détaillées à partir des dessins — vous gérez les prix, je gère les calculs.", details: ["Relevés numériques PDF/CAD", "Format Bluebeam & PlanSwift", "Organisation CSI MasterFormat", "Format personnalisé"], price: "À partir de 500$/portée" },
        { icon: "⚡", title: "Support jour de soumission", desc: "Révisions de dernière minute et compilation quand le temps presse.", details: ["Analyse des sous-traitants", "Vérification de la portée", "Compilation finale", "Service express disponible"], price: "À partir de 150$/h" },
      ],
    },
    value: {
      tag: "Le calcul", title: "Pourquoi l'externalisation est plus avantageuse",
      left: { label: "Estimateur à temps plein", total: "155 000$+/an", items: ["Salaire: 95 000$ – 130 000$", "Avantages et charges: 15 000$+", "Licences logicielles: 5 000$+", "Bureau et équipement: 10 000$+", "Payé sans travail: Oui", "Risque de roulement: Élevé"] },
      right: { label: "SharpBid", total: "À partir de 1 000$/mois", items: ["Payez seulement ce dont vous avez besoin", "Expertise senior incluse", "Logiciels à mes frais", "Aucun frais généraux", "Ajustez à la hausse ou à la baisse", "Toujours disponible"] },
      savings: "Économies potentielles: 100 000$+ par année",
    },
    industries: {
      tag: "Industries", title: "Tous les secteurs. Toutes les provinces.", sub: "Au service des entrepreneurs généraux, sous-traitants, promoteurs et propriétaires de la Colombie-Britannique à Terre-Neuve.",
      items: [
        { icon: "🏢", name: "Commercial et institutionnel", desc: "Tours de bureaux, écoles, hôpitaux, installations gouvernementales, commerce de détail." },
        { icon: "🏠", name: "Résidentiel", desc: "Maisons sur mesure, multi-logements, rénovations, habitations intercalaires." },
        { icon: "🏭", name: "Industriel", desc: "Entrepôts, usines, installations de traitement, entreposage frigorifique." },
        { icon: "🛣️", name: "Civil et terrassement", desc: "Routes, services publics, excavation, murs de soutènement, infrastructure municipale." },
        { icon: "🧱", name: "Béton et structure", desc: "Fondations, dalles, murs, colonnes, coffrages, acier structural." },
        { icon: "🪟", name: "Enveloppe du bâtiment", desc: "Mur-rideau, revêtement, toiture, imperméabilisation pour tous les climats canadiens." },
      ],
    },
    regions: {
      tag: "Couverture", title: "Au service des entrepreneurs à travers le Canada",
      areas: [
        { region: "Colombie-Britannique", cities: "Vancouver, Victoria, Kelowna, Surrey" },
        { region: "Alberta", cities: "Calgary, Edmonton, Red Deer, Lethbridge" },
        { region: "Saskatchewan et Manitoba", cities: "Saskatoon, Regina, Winnipeg" },
        { region: "Ontario", cities: "Toronto, Ottawa, Hamilton, Mississauga" },
        { region: "Québec", cities: "Montréal, Québec, Laval, Gatineau" },
        { region: "Canada atlantique", cities: "Halifax, Saint John, Moncton, St. John's" },
      ],
    },
    about: {
      tag: "À propos", title: "Un estimateur senior à vos côtés",
      p1: "Avec plus d'une décennie d'expérience en estimation chez des entrepreneurs généraux de premier plan, j'ai évalué des centaines de projets dans tous les secteurs — de 50K$ en rénovations à 50M$+ en constructions institutionnelles.",
      p2: "J'ai fondé SharpBid parce que trop d'entrepreneurs à travers le Canada perdent des contrats — non pas parce qu'ils ne peuvent pas construire, mais parce qu'ils n'ont pas la puissance d'estimation pour compétitionner.",
      p3: "Quand vous travaillez avec moi, vous obtenez un estimateur senior qui a été dans les tranchées — pas un junior qui apprend à vos frais.",
      highlights: ["10+ ans chez des EG de premier plan", "Expert Bluebeam, PlanSwift, On-Screen Takeoff & Excel", "Estimations complètes dans toutes les divisions CSI", "Basé à Vancouver, service partout au Canada"],
    },
    faq: {
      tag: "FAQ", title: "Questions fréquentes",
      items: [
        { q: "Quel est le délai de livraison?", a: "Habituellement 48-72 heures pour les projets petits à moyens. Service express et support jour de soumission disponibles avec préavis de 24 heures." },
        { q: "Quels logiciels utilisez-vous?", a: "Bluebeam Revu, PlanSwift, On-Screen Takeoff et Excel avancé. Je livre dans le format qui convient à votre équipe." },
        { q: "Travaillez-vous partout au Canada?", a: "Oui! Je sers des entrepreneurs dans toutes les provinces et tous les territoires. Tout est fait numériquement — dessins, devis, estimations et communication." },
        { q: "Comment gérez-vous la confidentialité?", a: "Chaque mandat commence par un accord de confidentialité. Vos données restent strictement entre nous." },
        { q: "Do you work in English too?", a: "Yes! I'm fully bilingual and work with contractors across all of Canada in both English and French." },
      ],
    },
    contact: {
      tag: "Commencez ici", title: "Obtenez votre consultation gratuite",
      sub: "Parlez-moi de votre projet. Je répondrai dans les 4 heures ouvrables — partout au Canada. Ou appelez (604) 245-4344.",
      fields: {
        name: "Nom complet", email: "Courriel", company: "Entreprise", phone: "Téléphone",
        province: "Province / Territoire", type: "Type de projet", budget: "Valeur estimée",
        timeline: "Échéance / Délai", details: "Détails du projet", submit: "Envoyer la demande",
        typeOptions: ["Sélectionnez...", "Estimation complète", "Budget préliminaire", "Relevé de quantités", "Audit d'estimation", "Support jour de soumission", "Forfait mensuel", "Autre"],
        budgetOptions: ["Sélectionnez...", "Moins de 500K$", "500K$ – 1M$", "1M$ – 5M$", "5M$ – 10M$", "10M$ – 25M$", "25M$+", "Pas encore déterminé"],
        provinceOptions: ["Sélectionnez...", "Colombie-Britannique", "Alberta", "Saskatchewan", "Manitoba", "Ontario", "Québec", "Nouveau-Brunswick", "Nouvelle-Écosse", "Î.-P.-É.", "Terre-Neuve-et-Labrador", "Territoires du Nord-Ouest", "Yukon", "Nunavut", "Multi-provinces / National"],
      },
      promise: "Pas de spam. Pas de pitch. Juste une conversation directe sur votre projet.",
    },
    lead: { title: "Guide gratuit", headline: "Le vrai coût de ne pas avoir d'estimateur", sub: "Une analyse de ce que les mauvaises estimations coûtent réellement aux entrepreneurs canadiens.", cta: "Télécharger le guide", placeholder: "Entrez votre courriel", ty: "Vérifiez votre boîte!" },
    footer: {
      tagline: "Estimation de niveau senior pour les entrepreneurs canadiens qui construisent intelligemment.",
      col1: "Services", col2: "Entreprise", col3: "Régions",
      copy: "© 2026 SharpBid Estimating. Basé à Vancouver, C.-B. Au service de tout le Canada.",
      phone: "(604) 245-4344",
      email: "info@sharpbid.ca",
      links1: ["Estimations complètes", "Forfaits mensuels", "Budgets préliminaires", "Audits", "Relevés de quantités", "Support soumission"],
      links2: ["À propos", "Industries", "FAQ", "Blogue", "Contact"],
      links3: ["Colombie-Britannique", "Alberta", "Ontario", "Québec", "Canada atlantique", "Prairies et Nord"],
    },
  },
};

function FadeIn({ children, delay = 0, className = "" }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

function FaqItem({ q, a, colors }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${colors.gray200}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Libre Franklin', sans-serif" }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: colors.navy, paddingRight: 20 }}>{q}</span>
        <span style={{ fontSize: 22, color: colors.ember, transition: "transform 0.3s", transform: open ? "rotate(45deg)" : "rotate(0)", flexShrink: 0, fontWeight: 300 }}>+</span>
      </button>
      <div style={{ maxHeight: open ? 400 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: colors.gray500, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

export default function SharpBidSite() {
  const [lang, setLang] = useState("en");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeService, setActiveService] = useState(0);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", company: "", phone: "", province: "", type: "", budget: "", timeline: "", details: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = CONTENT[lang];

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMobileMenu(false); };

  const colors = {
    navy: "#0A1628", navyLight: "#132240", slate: "#1A3054",
    blue: "#2563EB", blueLight: "#3B82F6",
    ember: "#E5700A", emberLight: "#F59E0B",
    cream: "#FAFAF7", white: "#FFFFFF",
    gray100: "#F3F4F6", gray200: "#E5E7EB", gray300: "#D1D5DB",
    gray500: "#6B7280", gray700: "#374151", gray900: "#111827",
    green: "#059669", red: "#DC2626",
  };

  return (
    <div style={{ fontFamily: "'Libre Franklin', 'Segoe UI', sans-serif", color: colors.gray900, background: colors.white, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800&family=Source+Serif+4:wght@600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: ${colors.ember}22; }
        html { scroll-behavior: smooth; }
        .be-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 5px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.25s ease; border: none; font-family: 'Libre Franklin', sans-serif; text-decoration: none; }
        .be-primary { background: ${colors.ember}; color: white; }
        .be-primary:hover { background: #CC6209; transform: translateY(-2px); box-shadow: 0 8px 20px ${colors.ember}35; }
        .be-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.3); }
        .be-outline:hover { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); }
        .be-tag { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: ${colors.ember}; margin-bottom: 10px; }
        .be-title { font-family: 'Source Serif 4', Georgia, serif; font-size: clamp(28px, 4vw, 44px); font-weight: 700; line-height: 1.2; margin-bottom: 16px; color: ${colors.navy}; }
        input, select, textarea { font-family: 'Libre Franklin', sans-serif; font-size: 15px; padding: 13px 16px; border: 1.5px solid ${colors.gray300}; border-radius: 5px; width: 100%; outline: none; transition: border-color 0.25s; background: white; color: ${colors.gray900}; }
        input:focus, select:focus, textarea:focus { border-color: ${colors.blue}; box-shadow: 0 0 0 3px ${colors.blue}18; }
        textarea { resize: vertical; min-height: 110px; }
        .be-section { padding: 96px 24px; max-width: 1180px; margin: 0 auto; }
        @media (max-width: 768px) {
          .be-section { padding: 60px 16px; }
          .g2 { grid-template-columns: 1fr !important; }
          .g3 { grid-template-columns: 1fr !important; }
          .g4 { grid-template-columns: 1fr 1fr !important; }
          .nav-links { display: none !important; }
          .mob-btn { display: flex !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: scrolled ? `${colors.navy}F2` : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: scrolled ? `1px solid rgba(255,255,255,0.07)` : "none", transition: "all 0.35s", padding: "0 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} onClick={() => scrollTo("hero")}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${colors.ember}, ${colors.emberLight})`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Source Serif 4', serif", fontWeight: 800, fontSize: 19, color: "white" }}>S</div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "white", letterSpacing: "-0.3px" }}>SharpBid</span>
          </div>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 26 }}>
            {[["services", t.nav.services], ["about", t.nav.about], ["industries", t.nav.industries], ["faq", t.nav.faq]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "color 0.25s", fontFamily: "'Libre Franklin'" }}
                onMouseEnter={e => e.target.style.color = "white"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.75)"}>{label}</button>
            ))}
            <button onClick={() => setLang(lang === "en" ? "fr" : "en")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "5px 11px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Libre Franklin'" }}>{lang === "en" ? "FR" : "EN"}</button>
            <button className="be-btn be-primary" onClick={() => scrollTo("contact")} style={{ padding: "9px 18px", fontSize: 13 }}>{t.nav.contact}</button>
          </div>
          <button className="mob-btn" style={{ display: "none", background: "none", border: "none", color: "white", fontSize: 26, cursor: "pointer", alignItems: "center" }} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? "✕" : "☰"}</button>
        </div>
        {mobileMenu && (
          <div style={{ background: colors.navy, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            {[["services", t.nav.services], ["about", t.nav.about], ["industries", t.nav.industries], ["faq", t.nav.faq], ["contact", t.nav.contact]].map(([id, l]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: "none", border: "none", color: "white", fontSize: 16, textAlign: "left", cursor: "pointer", padding: "6px 0", fontFamily: "'Libre Franklin'" }}>{l}</button>
            ))}
            <button onClick={() => { setLang(lang === "en" ? "fr" : "en"); setMobileMenu(false); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: 10, borderRadius: 4, cursor: "pointer", fontWeight: 700, fontFamily: "'Libre Franklin'" }}>{lang === "en" ? "Français" : "English"}</button>
            <a href="tel:+16042454344" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.ember, fontSize: 16, fontWeight: 700, textDecoration: "none", padding: "6px 0", fontFamily: "'Libre Franklin'" }}>📞 (604) 245-4344</a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" style={{ background: `linear-gradient(145deg, ${colors.navy} 0%, ${colors.slate} 55%, ${colors.navyLight} 100%)`, padding: "150px 24px 100px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -60, width: 380, height: 380, borderRadius: "50%", background: `${colors.ember}06`, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: "20%", width: 280, height: 280, borderRadius: "50%", background: `${colors.blue}08`, filter: "blur(60px)" }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <FadeIn><span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${colors.ember}18`, color: colors.ember, padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 24 }}>🇨🇦 {t.hero.badge}</span></FadeIn>
          <FadeIn delay={0.1}><h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 800, lineHeight: 1.08, color: "white", marginBottom: 22 }}>{t.hero.headline}<br /><span style={{ color: colors.ember }}>{t.hero.headlineAccent}</span></h1></FadeIn>
          <FadeIn delay={0.2}><p style={{ fontSize: "clamp(16px, 1.8vw, 18px)", lineHeight: 1.7, color: "rgba(255,255,255,0.72)", maxWidth: 620, marginBottom: 34 }}>{t.hero.sub}</p></FadeIn>
          <FadeIn delay={0.3}><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 }}>
            <button className="be-btn be-primary" onClick={() => scrollTo("contact")} style={{ fontSize: 16, padding: "15px 30px" }}>{t.hero.cta} →</button>
            <button className="be-btn be-outline" onClick={() => scrollTo("services")}>{t.hero.ctaSec}</button>
          </div></FadeIn>
          <FadeIn delay={0.4}><div className="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, maxWidth: 560 }}>
            {t.hero.stats.map((s, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${colors.ember}55`, paddingLeft: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "white", fontFamily: "'Source Serif 4', serif" }}>{s.num}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div></FadeIn>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={{ background: colors.cream, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <FadeIn><span className="be-tag">{t.pain.tag}</span></FadeIn>
          <FadeIn delay={0.1}><h2 className="be-title">{t.pain.title}</h2></FadeIn>
          <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 36 }}>
            {t.pain.items.map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}><div style={{ background: "white", borderRadius: 8, padding: 30, border: `1px solid ${colors.gray200}`, transition: "all 0.25s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.ember; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(10,22,40,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.gray200; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: colors.navy }}>{item.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: colors.gray500 }}>{item.desc}</p>
              </div></FadeIn>
            ))}
          </div>
          <FadeIn delay={0.4}><p style={{ textAlign: "center", marginTop: 44, fontSize: 19, fontWeight: 600, color: colors.navy, fontFamily: "'Source Serif 4', serif", fontStyle: "italic" }}>{t.pain.closer}</p></FadeIn>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="be-section">
        <FadeIn><span className="be-tag">{t.services.tag}</span></FadeIn>
        <FadeIn delay={0.1}><h2 className="be-title">{t.services.title}</h2></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 36, marginTop: 36 }} className="g2">
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {t.services.items.map((s, i) => (
              <button key={i} onClick={() => setActiveService(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 6, border: "none", cursor: "pointer", background: activeService === i ? `${colors.ember}0D` : "transparent", borderLeft: activeService === i ? `3px solid ${colors.ember}` : "3px solid transparent", fontFamily: "'Libre Franklin'", fontSize: 14, fontWeight: activeService === i ? 700 : 500, color: activeService === i ? colors.navy : colors.gray500, textAlign: "left", transition: "all 0.25s" }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span> {s.title}
              </button>
            ))}
          </div>
          <FadeIn key={activeService}>
            <div style={{ background: colors.gray100, borderRadius: 10, padding: 36 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: colors.navy, fontFamily: "'Source Serif 4', serif" }}>{t.services.items[activeService].icon} {t.services.items[activeService].title}</h3>
                <span style={{ background: colors.navy, color: colors.ember, padding: "7px 14px", borderRadius: 5, fontSize: 13, fontWeight: 700 }}>{t.services.items[activeService].price}</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: colors.gray700, marginBottom: 22 }}>{t.services.items[activeService].desc}</p>
              <div style={{ display: "grid", gap: 9 }}>
                {t.services.items[activeService].details.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: colors.gray700 }}>
                    <span style={{ color: colors.green, fontWeight: 700 }}>✓</span> {d}
                  </div>
                ))}
              </div>
              <button className="be-btn be-primary" onClick={() => scrollTo("contact")} style={{ marginTop: 24 }}>{t.nav.contact} →</button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* VALUE COMPARISON */}
      <section style={{ background: colors.navy, padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <FadeIn><span className="be-tag">{t.value.tag}</span></FadeIn>
          <FadeIn delay={0.1}><h2 className="be-title" style={{ color: "white" }}>{t.value.title}</h2></FadeIn>
          <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 36 }}>
            <FadeIn delay={0.2}><div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 30, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: colors.gray500, marginBottom: 6 }}>{t.value.left.label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "#EF4444", fontFamily: "'Source Serif 4', serif", marginBottom: 22 }}>{t.value.left.total}</div>
              {t.value.left.items.map((it, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13, color: "rgba(255,255,255,0.6)" }}><span style={{ color: "#EF444488" }}>✕</span> {it}</div>))}
            </div></FadeIn>
            <FadeIn delay={0.3}><div style={{ background: `${colors.ember}12`, borderRadius: 10, padding: 30, border: `2px solid ${colors.ember}40` }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: colors.ember, marginBottom: 6 }}>{t.value.right.label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: colors.green, fontFamily: "'Source Serif 4', serif", marginBottom: 22 }}>{t.value.right.total}</div>
              {t.value.right.items.map((it, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13, color: "rgba(255,255,255,0.8)" }}><span style={{ color: colors.green }}>✓</span> {it}</div>))}
            </div></FadeIn>
          </div>
          <FadeIn delay={0.4}><div style={{ textAlign: "center", marginTop: 28, fontSize: 20, fontWeight: 700, color: colors.green, fontFamily: "'Source Serif 4', serif" }}>{t.value.savings}</div></FadeIn>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="be-section">
        <FadeIn><span className="be-tag">{t.industries.tag}</span></FadeIn>
        <FadeIn delay={0.1}><h2 className="be-title">{t.industries.title}</h2></FadeIn>
        {t.industries.sub && <FadeIn delay={0.15}><p style={{ fontSize: 16, color: colors.gray500, marginBottom: 8 }}>{t.industries.sub}</p></FadeIn>}
        <div className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 36 }}>
          {t.industries.items.map((item, i) => (
            <FadeIn key={i} delay={i * 0.06}><div style={{ padding: 26, borderRadius: 8, border: `1px solid ${colors.gray200}`, transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = colors.ember; e.currentTarget.style.boxShadow = "0 6px 20px rgba(10,22,40,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = colors.gray200; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{item.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: colors.navy }}>{item.name}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: colors.gray500 }}>{item.desc}</p>
            </div></FadeIn>
          ))}
        </div>
      </section>

      {/* REGIONS - CANADA-WIDE */}
      <section style={{ background: colors.gray100, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <FadeIn><span className="be-tag">{t.regions.tag}</span></FadeIn>
          <FadeIn delay={0.1}><h2 className="be-title">{t.regions.title}</h2></FadeIn>
          <div className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 32 }}>
            {t.regions.areas.map((a, i) => (
              <FadeIn key={i} delay={i * 0.06}><div style={{ background: "white", borderRadius: 8, padding: "22px 24px", border: `1px solid ${colors.gray200}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.navy, marginBottom: 4 }}>{a.region}</div>
                <div style={{ fontSize: 13, color: colors.gray500 }}>{a.cities}</div>
              </div></FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="be-section">
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <FadeIn><div>
            <span className="be-tag">{t.about.tag}</span>
            <h2 className="be-title">{t.about.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: colors.gray700, marginBottom: 14 }}>{t.about.p1}</p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: colors.gray700, marginBottom: 14 }}>{t.about.p2}</p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: colors.gray700, fontWeight: 600 }}>{t.about.p3}</p>
          </div></FadeIn>
          <FadeIn delay={0.2}><div style={{ background: colors.cream, borderRadius: 10, padding: 30, border: `1px solid ${colors.gray200}` }}>
            {t.about.highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderBottom: i < t.about.highlights.length - 1 ? `1px solid ${colors.gray200}` : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${colors.ember}12`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.ember, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.navy }}>{h}</span>
              </div>
            ))}
          </div></FadeIn>
        </div>
      </section>

      {/* LEAD MAGNET */}
      <section style={{ background: `linear-gradient(135deg, ${colors.ember}, ${colors.emberLight})`, padding: "56px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <FadeIn>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>{t.lead.title}</span>
            <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: "clamp(22px, 3.2vw, 32px)", fontWeight: 700, color: "white", margin: "10px 0" }}>{t.lead.headline}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", marginBottom: 22 }}>{t.lead.sub}</p>
            {!leadSubmitted ? (
              <div style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
                <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder={t.lead.placeholder} style={{ flex: 1, minWidth: 220, border: "none", borderRadius: 5, padding: "13px 16px" }} />
                <button className="be-btn" onClick={async () => { if (leadEmail) { try { await fetch("https://formspree.io/f/mreoylbw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: leadEmail, _subject: "New Guide Download — SharpBid" }) }); setLeadSubmitted(true); } catch (err) { alert("Something went wrong. Please try again."); } } }} style={{ background: colors.navy, color: "white", padding: "13px 22px" }}>{t.lead.cta} →</button>
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 6, padding: 14, color: "white", fontWeight: 600 }}>✓ {t.lead.ty}</div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="be-section">
        <FadeIn><span className="be-tag">{t.faq.tag}</span></FadeIn>
        <FadeIn delay={0.1}><h2 className="be-title">{t.faq.title}</h2></FadeIn>
        <div style={{ marginTop: 36, maxWidth: 780 }}>
          {t.faq.items.map((item, i) => <FadeIn key={i} delay={i * 0.04}><FaqItem q={item.q} a={item.a} colors={colors} /></FadeIn>)}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: colors.gray100, padding: "96px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <FadeIn><div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="be-tag">{t.contact.tag}</span>
            <h2 className="be-title">{t.contact.title}</h2>
            <p style={{ fontSize: 15, color: colors.gray500 }}>{t.contact.sub}</p>
          </div></FadeIn>
          {!formSubmitted ? (
            <FadeIn delay={0.15}><div style={{ background: "white", borderRadius: 10, padding: "36px 32px", boxShadow: "0 16px 40px rgba(10,22,40,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="g2">
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.name} *</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.email} *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.company}</label><input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.phone}</label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.province} *</label>
                  <select value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })}>{t.contact.fields.provinceOptions.map((o, i) => <option key={i} value={i === 0 ? "" : o}>{o}</option>)}</select></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.type} *</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>{t.contact.fields.typeOptions.map((o, i) => <option key={i} value={i === 0 ? "" : o}>{o}</option>)}</select></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.budget}</label>
                  <select value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}>{t.contact.fields.budgetOptions.map((o, i) => <option key={i} value={i === 0 ? "" : o}>{o}</option>)}</select></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.timeline}</label><input value={formData.timeline} onChange={e => setFormData({ ...formData, timeline: e.target.value })} /></div>
              </div>
              <div style={{ marginTop: 14 }}><label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: "block", marginBottom: 5 }}>{t.contact.fields.details}</label><textarea value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} /></div>
              <button className="be-btn be-primary" onClick={async () => { if (formData.name && formData.email && formData.type && formData.province) { try { await fetch("https://formspree.io/f/mpqoylwk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formData.name, email: formData.email, company: formData.company, phone: formData.phone, province: formData.province, projectType: formData.type, budget: formData.budget, timeline: formData.timeline, details: formData.details, _subject: "New SharpBid Lead: " + formData.type + " — " + formData.name }) }); setFormSubmitted(true); } catch (err) { alert("Something went wrong. Please email info@sharpbid.ca directly or call (604) 245-4344."); } } }} style={{ width: "100%", justifyContent: "center", marginTop: 20, padding: 15, fontSize: 15 }}>{t.contact.fields.submit} →</button>
              <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: colors.gray500 }}>{t.contact.promise}</p>
            </div></FadeIn>
          ) : (
            <FadeIn><div style={{ background: "white", borderRadius: 10, padding: 44, textAlign: "center", boxShadow: "0 16px 40px rgba(10,22,40,0.06)" }}>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: `${colors.green}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 26 }}>✓</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, fontFamily: "'Source Serif 4', serif", marginBottom: 10 }}>{lang === "en" ? "Request Received!" : "Demande reçue!"}</h3>
              <p style={{ fontSize: 15, color: colors.gray500 }}>{lang === "en" ? "I'll review your project and get back to you within 4 business hours." : "Je réviserai votre projet et répondrai dans les 4 heures ouvrables."}</p>
              <a href="tel:+16042454344" style={{ display: "inline-block", marginTop: 14, fontSize: 14, color: colors.ember, textDecoration: "none", fontWeight: 600 }}>{lang === "en" ? "Or call now: (604) 245-4344" : "Ou appelez: (604) 245-4344"}</a>
            </div></FadeIn>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: colors.navy, padding: "56px 24px 28px", color: "rgba(255,255,255,0.6)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="g3" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 36, marginBottom: 36 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${colors.ember}, ${colors.emberLight})`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Source Serif 4', serif", fontWeight: 800, fontSize: 17, color: "white" }}>S</div>
                <span style={{ fontWeight: 800, fontSize: 16, color: "white" }}>SharpBid</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 300 }}>{t.footer.tagline}</p>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <a href="tel:+16042454344" style={{ fontSize: 13, color: colors.ember, textDecoration: "none", fontWeight: 600 }}>📞 {t.footer.phone}</a>
                <a href="mailto:info@sharpbid.ca" style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>📩 {t.footer.email}</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "white", marginBottom: 14 }}>{t.footer.col1}</h4>
              {t.footer.links1.map((l, i) => <div key={i} style={{ fontSize: 13, padding: "4px 0", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = colors.ember} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}>{l}</div>)}
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "white", marginBottom: 14 }}>{t.footer.col2}</h4>
              {t.footer.links2.map((l, i) => <div key={i} style={{ fontSize: 13, padding: "4px 0", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = colors.ember} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}>{l}</div>)}
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "white", marginBottom: 14 }}>{t.footer.col3}</h4>
              {t.footer.links3.map((l, i) => <div key={i} style={{ fontSize: 13, padding: "4px 0", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = colors.ember} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}>{l}</div>)}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: 12 }}>
            <span>{t.footer.copy}</span>
            <span style={{ cursor: "pointer" }} onClick={() => setLang(lang === "en" ? "fr" : "en")}>{lang === "en" ? "Français" : "English"} ↗</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
