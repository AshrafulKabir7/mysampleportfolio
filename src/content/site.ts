/**
 * Single source of truth for every word on the site.
 * Facts come from the GitHub READMEs, the public CV and Crossref (checked Oct 2026).
 * Keep claims checkable: statuses are honest, numbers have a source.
 */

import defectoShot from "../assets/work/defecto.webp";
import tallycamShot from "../assets/work/tallycam.webp";
import citelyShot from "../assets/work/citely.webp";
import swirlyShot from "../assets/work/swirly.webp";
import cadillacsShot from "../assets/work/cadillacs.webp";
import portrait from "../assets/alif.webp";
import avatar from "../assets/alif-avatar.webp";

const GH = "https://github.com/AshrafulKabir7";

export const profile = {
  name: "Ashraful Kabir Alif",
  first: "Ashraful",
  last: "Kabir Alif",
  short: "Alif",
  initials: "AKA",
  bangla: { first: "আশরাফুল", last: "কবির আলিফ", city: "ঢাকা" },
  role: "AI researcher & ML engineer",
  location: "Dhaka, Bangladesh",
  timezone: "Asia/Dhaka",
  coords: "23.81° N · 90.41° E",
  status: "Open to PhD opportunities & research collaborations",
  thesis:
    "I build machine learning that holds up when the signal is faint and the stakes are high.",
  lede:
    "From JWST coronagraph frames and kidney CT scans to ICU treatment policies and the human genome. Researcher at BRAC University, AI developer at Shahriar Labs — I ship what I study.",
  motto: "Keep learning because knowledge is the key to power!",
  email: "md.ashraful.kabir.alif@g.bracu.ac.bd",
  portrait,
  avatar,
  updated: "Oct 2026",
  version: "v3",
  links: {
    github: GH,
    linkedin: "https://www.linkedin.com/in/ashrafulkabiralif",
    orcid: "https://orcid.org/0009-0001-1011-1236",
    cv: "https://docs.google.com/document/d/12lkdgyVDKvVSGHRtOkmYGRAjv1mhj2l5H8vCnq3BFnM/preview",
  },
} as const;

export type NavItem = { id: string; label: string; index: string };

export const nav: NavItem[] = [
  { id: "research", label: "Research", index: "01" },
  { id: "builds", label: "Builds", index: "02" },
  { id: "papers", label: "Papers", index: "03" },
  { id: "path", label: "Path", index: "04" },
  { id: "about", label: "About", index: "05" },
  { id: "contact", label: "Contact", index: "06" },
];

/* ───────────────────────────── Research threads ───────────────────────────── */

export type ThreadId = "exoplanet" | "renal" | "sepsis" | "genome";

export type Metric = { value: number; decimals?: number; prefix?: string; suffix?: string; label: string };

export type ResearchThread = {
  id: ThreadId;
  index: string;
  kicker: string;
  title: string;
  question: string;
  approach: string;
  result: string;
  metrics: Metric[];
  status: string;
  tags: string[];
  links: { label: string; href: string }[];
};

export const researchIntro = {
  title: ["Four threads,", "one question:"],
  emphasis: "can you trust it?",
  body: "Different domains, same discipline — honest baselines, held-out tests, statistics that survive a second look, and models that say when they are unsure.",
};

export const threads: ResearchThread[] = [
  {
    id: "exoplanet",
    index: "01",
    kicker: "Astro-ML · BSc thesis",
    title: "Finding planets next to blinding stars",
    question:
      "Can a model pick out a faint exoplanet in JWST/MIRI coronagraphic images when it has only seen a handful of labelled examples?",
    approach:
      "A Siamese ResNet18 trained with contrastive and few-shot learning on direct-imaging frames, separating stars from companions instead of memorising them.",
    result: "92.16% accuracy; on exoplanets, segmentation Dice 0.90 and IoU 0.80.",
    metrics: [
      { value: 92.16, decimals: 2, suffix: "%", label: "accuracy" },
      { value: 0.9, decimals: 2, label: "exoplanet Dice" },
      { value: 0.8, decimals: 2, label: "exoplanet IoU" },
    ],
    status: "Paper submitted",
    tags: ["JWST / MIRI", "Contrastive learning", "Siamese nets", "Few-shot"],
    links: [],
  },
  {
    id: "renal",
    index: "02",
    kicker: "Medical imaging",
    title: "Segmenting kidney tumours and stones with a frozen giant",
    question:
      "Can a foundation segmentation model be adapted to tiny renal calculi and tumours on CT without full fine-tuning or hand-drawn masks?",
    approach:
      "MoE-RenalSAM: a frozen SAM2 Hiera-L encoder with rank-16 LoRA adapters, a class-conditional router over four experts, and weak supervision from contour-guided superpixel pseudo-masks.",
    result:
      "Tumour Dice 88.19% (457 slices) and stone Dice 84.06% (276 slices) on a held-out set of 1,749 CT slices, against 68.31% and 29.86% for zero-shot SAM2 — training only 8.0M of 220.7M parameters.",
    metrics: [
      { value: 88.19, decimals: 2, suffix: "%", label: "tumour Dice" },
      { value: 84.06, decimals: 2, suffix: "%", label: "stone Dice" },
      { value: 8.0, decimals: 1, suffix: "M", label: "trainable params" },
    ],
    status: "Write-up in progress",
    tags: ["SAM2", "LoRA", "Mixture-of-experts", "Weak supervision"],
    links: [{ label: "Code", href: `${GH}/MoE-RenalSAM` }],
  },
  {
    id: "sepsis",
    index: "03",
    kicker: "Offline RL · Healthcare · CSE753 team project",
    title: "What a sepsis benchmark can’t see",
    question:
      "When an offline RL agent learns sepsis treatment from logged ICU data, what should it do with the actions clinicians rarely took — and can the benchmark tell the difference?",
    approach:
      "Action-Masked Conservative Q-Learning on the ICU-Sepsis benchmark: hard logit masking, a Lagrangian safety penalty, and a diffusion behaviour prior guided by a critic ensemble — evaluated exactly, with no Monte Carlo noise.",
    result:
      "Diffusion-AM-CQL takes no inadmissible actions and reaches an exact return of 0.794 under both safety rules (simulator optimum: 0.875). Unmasked Deep CQL falls from 0.779 to 0.694 once an inadmissible action ends the episode. Every learned model lands between 0.765 and 0.794, so the benchmark barely separates them; only the simulator’s true dynamics show the gap to 0.875.",
    metrics: [
      { value: 0, suffix: "%", label: "inadmissible actions" },
      { value: 0.794, decimals: 3, label: "Diffusion-AM-CQL exact return" },
      { value: 0.875, decimals: 3, label: "simulator optimum" },
    ],
    status: "Study in progress",
    tags: ["Offline RL", "CQL", "Safe RL", "Diffusion policies"],
    links: [{ label: "Code", href: `${GH}/sepsis-offline-rl` }],
  },
  {
    id: "genome",
    index: "04",
    kicker: "Genomics · Drug discovery",
    title: "Reading variants and molecules with calibrated doubt",
    question:
      "Can models of genetic variants and drug molecules attach an uncertainty you can act on, not just a score?",
    approach:
      "VariantFusion, my MSc thesis: multi-modal, isoform-aware variant effect prediction with per-gene conformal sets. Alongside it, a GATv2 graph network predicting 23 ADMET endpoints jointly, with MC-dropout uncertainty.",
    result:
      "VariantFusion is in progress — no results yet. Separately, the ADMET model reaches test AUC 0.988 on intestinal absorption and 0.892 on blood–brain barrier penetration from a single multi-task backbone.",
    metrics: [
      { value: 23, label: "ADMET endpoints, one model" },
      { value: 0.988, decimals: 3, label: "ADMET · HIA test AUC" },
      { value: 0.892, decimals: 3, label: "ADMET · BBB test AUC" },
    ],
    status: "MSc thesis in progress",
    tags: ["Variant effect", "Conformal prediction", "GNNs", "ADMET"],
    links: [{ label: "ADMET code", href: `${GH}/ADMET_Research` }],
  },
];

export const sideExperiments = [
  {
    title: "Music genre clustering with audio and lyric VAEs (GTZAN + Bangla)",
    note: "Audio, lyric and fused VAEs over GTZAN and Bangla song lyrics, scored on six clustering metrics; a β-sweep shows posterior collapse from β ≥ 4.",
    href: `${GH}/VAE-Music-Project`,
  },
  {
    title: "Fair & explainable chest X-ray diagnosis",
    note: "Multi-disease CheXpert classification with Grad-CAM and demographic bias audits.",
    href: "",
  },
  {
    title: "Monotonic neuro-symbolic semantic loss",
    note: "Domain constraints as a loss, for tabular models that stay consistent.",
    href: "",
  },
];

/* ───────────────────────────────── Builds ───────────────────────────────── */

export type CoverMotif =
  | "legal"
  | "invoice"
  | "clinic"
  | "crypto"
  | "map"
  | "planner"
  | "anomaly"
  | "tracking"
  | "citation"
  | "arcade"
  | "storefront";

export type Build = {
  slug: string;
  name: string;
  year: string;
  tagline: string;
  summary: string;
  stack: string[];
  proof: string[];
  metrics?: Metric[];
  image?: string;
  motif: CoverMotif;
  /** brand-ish hue for the cover art, any CSS color */
  hue: string;
  live?: string;
  repo: string;
  featured?: boolean;
  inBrowser?: boolean;
};

export const buildsIntro = {
  title: "Research that",
  emphasis: "ships.",
  body: "Working software with evaluations you can rerun. Defecto, Tallycam and Citely run entirely in your browser — anything you test them with stays on your device.",
};

export const builds: Build[] = [
  {
    slug: "defecto",
    name: "Defecto",
    year: "2026",
    tagline: "Spots manufacturing defects after seeing only good parts.",
    summary:
      "Unsupervised visual inspection: a PatchCore-style memory bank over ResNet18 patch features, trained on good parts only, exported to one ONNX graph that runs on WebGPU with a WebAssembly fallback. Thresholds are fitted on validation only; capsules remain the documented weak case (image AUROC 0.708).",
    stack: ["PyTorch", "PatchCore", "ONNX", "WebGPU", "React"],
    proof: [
      "Browser and Python agree on all 306 test images, score and verdict",
      "Thresholds fitted on validation only — never on test",
      "Capsules is the weak case (image AUROC 0.708) — documented, with the reason",
    ],
    metrics: [
      { value: 0.997, decimals: 3, label: "pixel AUROC · PCB1" },
      { value: 0.931, decimals: 3, label: "image AUROC · PCB1" },
      { value: 306, suffix: "/306", label: "browser-parity images" },
    ],
    image: defectoShot,
    motif: "anomaly",
    hue: "#22b8e6",
    live: "https://defecto-five.vercel.app",
    repo: `${GH}/Defecto`,
    featured: true,
    inBrowser: true,
  },
  {
    slug: "tallycam",
    name: "Tallycam",
    year: "2026",
    tagline: "Detect, track and count objects in video — on your device.",
    summary:
      "YOLO26n through ONNX Runtime Web plus a two-stage tracker in the spirit of ByteTrack — motion prediction, size-aware gating and class voting; counts directional line crossings and zone occupancy.",
    stack: ["YOLO26n", "ONNX Runtime Web", "WebGPU", "TypeScript", "Playwright"],
    proof: [
      "Tracker v2 gives the 8 objects in a 54 s test clip exactly 8 IDs, down from 14",
      "16 unit tests + 6 browser tests",
    ],
    metrics: [
      { value: 8, prefix: "14→", label: "track IDs for 8 objects" },
      { value: 210, suffix: " ms", label: "per frame · WebGPU on a laptop iGPU" },
      { value: 22, label: "automated tests" },
    ],
    image: tallycamShot,
    motif: "tracking",
    hue: "#ef4f4f",
    live: "https://tallycam.vercel.app",
    repo: `${GH}/Tallycam`,
    featured: true,
    inBrowser: true,
  },
  {
    slug: "citely",
    name: "Citely",
    year: "2026",
    tagline: "Answers only from your documents — and says no when it can’t.",
    summary:
      "Grounded document Q&A with section-aware chunking, hybrid BM25 + n-gram retrieval and an IDF-weighted evidence gate that declines off-topic questions. Extractive by design: no LLM, so every answer is quoted from your documents.",
    stack: ["TypeScript", "BM25", "Hybrid retrieval", "React", "Vite"],
    proof: ["First citation from the right document on 20/20 test questions", "Off-topic questions declined 6/6"],
    metrics: [
      { value: 20, suffix: "/20", label: "right-document citations" },
      { value: 6, suffix: "/6", label: "off-topic declined" },
    ],
    image: citelyShot,
    motif: "citation",
    hue: "#e3c21b",
    live: "https://citely-pi.vercel.app",
    repo: `${GH}/Citely`,
    featured: true,
    inBrowser: true,
  },
  {
    slug: "casecraft",
    name: "CaseCraft",
    year: "2026",
    tagline: "Legal drafting that cites its sources and learns from attorney edits.",
    summary:
      "Three-tier OCR (PDF text → Tesseract → vision LLM), hybrid retrieval at 0.65 semantic + 0.35 BM25 over ChromaDB, citation-mapped drafts, and a diff engine that turns attorney edits into reusable writing patterns.",
    stack: ["FastAPI", "ChromaDB", "Gemini", "Next.js", "Tesseract"],
    proof: ["Drafts carry citations mapped to source passages, plus a grounding report", "Per-chunk OCR confidence carried into retrieval"],
    motif: "legal",
    hue: "#c8a46a",
    repo: `${GH}/PSL-Flow`,
    featured: true,
  },
  {
    slug: "readly",
    name: "Readly",
    year: "2026",
    tagline: "Private invoice OCR that shows where every value came from.",
    summary:
      "PDF.js text layer for digital files, Tesseract.js with a deskew–upscale–Sauvola second pass for photos, and four consistency checks before approval.",
    stack: ["Tesseract.js", "PDF.js", "TypeScript"],
    proof: ["All bundled samples pass 4/4 checks"],
    motif: "invoice",
    hue: "#7c9cff",
    repo: `${GH}/Readly`,
    inBrowser: true,
  },
  {
    slug: "qliniq",
    name: "Qliniq",
    year: "2026",
    tagline: "Multi-tenant clinic platform with live token queues.",
    summary: "NestJS + Prisma + PostgreSQL API, Next.js 15 front end, Socket.IO queue broadcasts and a no-login kiosk display.",
    stack: ["NestJS", "Prisma", "Socket.IO", "Next.js"],
    proof: ["6 roles, 12 data models, real-time queue"],
    motif: "clinic",
    hue: "#6d6af8",
    repo: `${GH}/Qliniq`,
  },
  {
    slug: "kryptos",
    name: "Kryptos",
    year: "2026",
    tagline: "A cryptography lab — DES, AES, RSA and ECC written from scratch.",
    summary: "Pure-Python implementations behind a FastAPI service, with frequency-analysis and factorisation attacks and live benchmarks.",
    stack: ["Python", "FastAPI", "React"],
    proof: ["No crypto library used"],
    motif: "crypto",
    hue: "#8be04e",
    repo: `${GH}/Kryptos`,
  },
  {
    slug: "prohori",
    name: "Prohori",
    year: "2026",
    tagline: "Security-guard operations on a live site map.",
    summary: "Upload a site plan, drag posts into place and see staffed or vacant posts live; rosters, logs and payroll-ready hour reports.",
    stack: ["React", "Express", "SQLite", "Leaflet"],
    proof: ["Live staffed / vacant overlays"],
    motif: "map",
    hue: "#2fb9a7",
    repo: `${GH}/Prohori`,
  },
  {
    slug: "cadillacs",
    name: "Cadillacs & Dinosaurs II",
    year: "2026",
    tagline: "A fan sequel to Capcom’s 1993 arcade brawler, in a browser tab.",
    summary: "Plain-JS canvas beat-’em-up with six chapters, ROM-decoded hero animation frames, gamepad + touch controls and a test bot that clears every chapter.",
    stack: ["JavaScript", "Canvas", "Web Audio"],
    proof: ["Deterministic bot clears all 6 chapters"],
    image: cadillacsShot,
    motif: "arcade",
    hue: "#d4f25c",
    live: "https://cadillacsanddinosaurs2.vercel.app",
    repo: `${GH}/Cadillacs-and-Dinosaurs-II`,
  },
  {
    slug: "swirly",
    name: "Swirly",
    year: "2026",
    tagline: "A playful, fully animated storefront for a fictional milkshake shop.",
    summary: "Eight routes, a configurable cart with combo and promo logic, and pickup slots that respect opening hours.",
    stack: ["React", "Framer Motion", "Tailwind"],
    proof: ["Combo and promo-code cart; pickup slots follow opening hours"],
    image: swirlyShot,
    motif: "storefront",
    hue: "#ff5fa2",
    live: "https://swirly-black.vercel.app",
    repo: `${GH}/Swirly`,
  },
];

/* ─────────────────────────────── Publications ─────────────────────────────── */

export type PaperStatus = "Published" | "Submitted" | "In preparation";

export type Paper = {
  title: string;
  authors?: string[];
  venue?: string;
  year: string;
  status: PaperStatus;
  tldr: string;
  links: { label: string; href: string }[];
  bibtex?: string;
};

export const papersIntro = {
  title: "Papers &",
  emphasis: "manuscripts",
  body: "Statuses are exactly what they say. Venue names appear only once work is accepted.",
};

export const papers: Paper[] = [
  {
    title: "Pattern Recognition in Disaster Response: Leveraging Machine Learning for Twitter Analysis",
    authors: [
      "Md. Impreeaj Hossain",
      "Musaib Ibn Habib Mikdad",
      "Sk. Jamil Hossain",
      "Ridwanul Haque",
      "Md. Ashraful Kabir Alif",
      "Ehsanur Rahman Rhythm",
      "Annajiat Alim Rasel",
    ],
    venue: "ICITA 2024 · Lecture Notes in Networks and Systems, Springer",
    year: "2025",
    status: "Published",
    tldr: "Classifying disaster-related tweets with transformer and recurrent models to help responders find signal in social-media noise.",
    links: [{ label: "DOI", href: "https://doi.org/10.1007/978-981-96-1758-6_4" }],
    bibtex: `@inproceedings{hossain2025disaster,
  title     = {Pattern Recognition in Disaster Response: Leveraging Machine Learning for Twitter Analysis},
  author    = {Hossain, Md. Impreeaj and Mikdad, Musaib Ibn Habib and Hossain, Sk. Jamil and Haque, Ridwanul and Alif, Md. Ashraful Kabir and Rhythm, Ehsanur Rahman and Rasel, Annajiat Alim},
  booktitle = {Proceedings of the International Conference on Information Technology and Applications (ICITA 2024)},
  series    = {Lecture Notes in Networks and Systems},
  publisher = {Springer Nature Singapore},
  pages     = {41--53},
  year      = {2025},
  doi       = {10.1007/978-981-96-1758-6_4}
}`,
  },
  {
    title:
      "Synergistic Application of Contrastive Learning and Computer Vision Techniques for Direct Imaging-based Exoplanet Detection using JWST Data",
    year: "2025",
    status: "Submitted",
    tldr: "Contrastive, few-shot detection of exoplanets in JWST/MIRI coronagraphic images.",
    links: [],
  },
  {
    title: "Enhancing Predictive Consistency in Tabular Classification via Monotonic Neuro-Symbolic Semantic Loss",
    year: "2025",
    status: "Submitted",
    tldr: "Encoding monotonic domain knowledge as a semantic loss so tabular models stay consistent.",
    links: [],
  },
  {
    title: "Explainable Deep Learning for Chromatin Accessibility Prediction",
    year: "2025",
    status: "Submitted",
    tldr: "Explainable deep models that predict chromatin accessibility from DNA sequence.",
    links: [],
  },
  {
    title: "Fair and Explainable Deep Learning for Multi-Disease Chest X-Ray Diagnosis using CheXpert and Grad-CAM",
    year: "2025",
    status: "In preparation",
    tldr: "Multi-label chest X-ray diagnosis audited for demographic bias, explained with Grad-CAM.",
    links: [],
  },
];

/* ─────────────────────────────── Path (CV) ─────────────────────────────── */

export type PathEntry = {
  kind: "work" | "research" | "teaching" | "education";
  role: string;
  org: string;
  place?: string;
  period: string;
  points: string[];
  tags?: string[];
};

export const pathIntro = {
  title: "Lab, classroom,",
  emphasis: "and production.",
  body: "Research and engineering at the same time, on purpose: each keeps the other honest.",
};

export const path: PathEntry[] = [
  {
    kind: "work",
    role: "AI Developer",
    org: "Shahriar Labs",
    place: "Dhaka",
    period: "2024 — Now",
    points: [
      "Built 6+ AI products for education, research and commerce — ReXearch (research networking, 150+ beta users), TryOn (real-time AI cosmetics try-on at 30+ FPS), QuantumSketch (text to 60-second STEM explainers, 50+ made), UniVerse LMS and ProcureFlow.",
      "Django / FastAPI / PostgreSQL / Redis back ends handling thousands of API calls a day; Dockerised LLM and vision pipelines with 99%+ uptime.",
    ],
    tags: ["Django", "FastAPI", "PyTorch", "Docker"],
  },
  {
    kind: "work",
    role: "Software & Systems Analyst",
    org: "Sirajganj Economic Zone Ltd (SEZL)",
    place: "Dhaka",
    period: "Jan 2025 — Now",
    points: [
      "Requirements for an 11-module ERP; Django/SQL prototypes that sped up approval workflows by 30–40%.",
      "Digitised operations to cut paper-based processes by about 60%; technical lead on the corporate website revamp; Microsoft 365 and database admin for 50+ staff.",
    ],
    tags: ["ERP", "Django", "SQL", "BPMN"],
  },
  {
    kind: "research",
    role: "Researcher",
    org: "BRAC University · CSE",
    place: "Advised by Prof. Md. Golam Rabiul Alam",
    period: "Ongoing",
    points: [
      "Exoplanet detection in JWST imaging, fair chest X-ray diagnosis, neuro-symbolic losses and chromatin accessibility prediction.",
      "Supervises undergraduate peers on research projects.",
    ],
    tags: ["Computer vision", "XAI", "Genomics"],
  },
  {
    kind: "teaching",
    role: "Undergraduate Teaching Assistant",
    org: "BRAC University · CSE",
    period: "Spring 2023 — Now",
    points: ["Python, Data Structures & Algorithms and OOP — supporting 120+ students each semester."],
  },
  {
    kind: "education",
    role: "M.Sc. Computer Science & Engineering",
    org: "BRAC University",
    period: "Expected 2027",
    points: ["Machine learning, computer vision and intelligent data systems. Thesis: VariantFusion — variant effect prediction."],
  },
  {
    kind: "education",
    role: "B.Sc. Computer Science & Engineering",
    org: "BRAC University",
    period: "2024 · CGPA 3.92 / 4.00",
    points: ["Thesis: contrastive learning for detecting exoplanets and stars in astronomical imagery."],
  },
];

export type Recognition = { year: string; title: string; detail: string };

export const recognition: Recognition[] = [
  { year: "2025", title: "Orange Corners programme", detail: "Top 14 of 265 teams" },
  { year: "2021–24", title: "Vice-Chancellor’s & Dean’s Merit Lists", detail: "BRAC University" },
  { year: "2024", title: "NVIDIA Inception", detail: "Startup accepted" },
  { year: "2025", title: "Solvio AI Hackathon", detail: "Selected participant · National AI Innovation Track" },
  { year: "2025", title: "Distinguished Speaker", detail: "Advanced Earth & Climate Science Congress · Berlin" },
  { year: "2026", title: "Distinguished Speaker", detail: "Advanced Chemistry World Congress · Rome" },
];

/* ─────────────────────────────── About / model card ─────────────────────────────── */

export const modelCard = {
  model: "ashraful-kabir-alif",
  architecture: "Researcher × builder, trained end-to-end",
  training: "BRAC University CSE · Dhaka · far too many Colab notebooks",
  intendedUse: ["Research collaborations", "PhD opportunities", "ML engineering on hard problems"],
  strengths: ["Turning papers into working software", "Evaluation you can rerun", "Explaining models to non-ML people"],
  limitations: ["Will ask “what’s the held-out split?”", "Opens one more browser tab than needed"],
  now: [
    { label: "Researching", value: "VariantFusion — calibrated variant effect prediction (MSc thesis)" },
    { label: "Writing", value: "Safe offline RL for sepsis — what benchmarks can’t see" },
    { label: "Shipping", value: "In-browser vision tools on WebGPU" },
  ],
};

export const stack: { group: string; items: string[] }[] = [
  { group: "Learning", items: ["PyTorch", "TensorFlow", "Hugging Face", "scikit-learn", "PyTorch Geometric"] },
  { group: "Vision & XAI", items: ["SAM2", "YOLO", "OpenCV", "Grad-CAM", "SHAP"] },
  { group: "Decisions & stats", items: ["Offline RL", "Conformal prediction", "MC Dropout", "rliable"] },
  { group: "Shipping", items: ["Python", "TypeScript", "Go", "Django", "FastAPI", "React", "PostgreSQL", "Docker", "ONNX / WebGPU"] },
];

/** Facts only, each traceable to a repo or the CV. Used for the receipts strip. */
export const receipts: Metric[] = [
  { value: 1, label: "peer-reviewed paper (Springer LNNS)" },
  { value: 3, label: "manuscripts under review" },
  { value: 120, suffix: "+", label: "students supported each term as a TA" },
  { value: 3.92, decimals: 2, label: "BSc CGPA" },
];

export const focusTicker = [
  "Exoplanet detection",
  "Medical imaging",
  "Offline reinforcement learning",
  "Variant effect prediction",
  "Drug property prediction",
  "In-browser computer vision",
  "Explainable & fair AI",
  "Retrieval you can cite",
];
