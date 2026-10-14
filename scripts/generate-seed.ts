import fs from "fs";
import path from "path";

interface RawSeedLead {
  companyName: string;
  domain: string;
  websiteUrl: string;
  category: string;
  description: string;
  estimatedTeamSize: number;
  foundedYear: number;
  estimatedArrMin: number;
  estimatedArrMax: number;
  arrHintString: string;
  techStack: string; // comma separated
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactType: string;
  websiteStatus: string;
  httpStatusCode: number;
  sslValid: boolean;
  responseTimeMs: number;
}

const FIRST_NAMES = [
  "Alexander", "Elena", "Marcus", "Sarah", "David", "Priya", "Julian", "Clara",
  "Michael", "Sophia", "Thomas", "Amina", "Lucas", "Maya", "Daniel", "Chloe",
  "Nathan", "Isabella", "Gabriel", "Olivia", "Ethan", "Zoe", "Vikram", "Hannah",
  "Benjamin", "Layla", "Samuel", "Emily", "Mateo", "Grace", "Oliver", "Ava",
  "Noah", "Mia", "William", "Harper", "James", "Evelyn", "Leo", "Amelia"
];

const LAST_NAMES = [
  "Vance", "Kovacs", "Chen", "Sterling", "O'Connor", "Patel", "Mercer", "Dubois",
  "Holloway", "Lindqvist", "Novak", "Al-Mansoor", "Rossi", "Tanaka", "Sinclair", "Vargas",
  "Kim", "Morales", "Schneider", "Fontaine", "Larsson", "Sorensen", "Kowalski", "Santos",
  "Reyes", "Nakamura", "Fischer", "Castillo", "Moreau", "Bergman", "Petrov", "Gomez"
];

const CATEGORIES = [
  { name: "Vertical SaaS", weight: 35, descriptions: [
    "Specialized practice management and billing for veterinary clinics",
    "Field dispatch, GPS routing, and invoicing software for commercial HVAC",
    "Marina slip reservation, dock utilities, and harbor management SaaS",
    "Independent dental clinic patient charting and insurance claim automation",
    "Heavy equipment rental inventory and telematics dispatch platform",
    "Specialty coffee roastery batch tracking, inventory, and B2B wholesale portal",
    "Municipal tree inventory, arborist risk assessment, and city permit software",
    "Commercial roofing inspection drone report generator and bid calculator"
  ]},
  { name: "B2B Workflow", weight: 25, descriptions: [
    "Collaborative accounts payable automated 3-way invoice matching for mid-market",
    "SOC2 and ISO27001 continuous compliance evidence automation for remote teams",
    "Enterprise contract approval routing and digital redlining workflow",
    "Multi-state contractor wage parity, payroll audit, and reporting engine",
    "Internal equipment check-out and maintenance schedule workflow platform"
  ]},
  { name: "DevTools & Infra", weight: 20, descriptions: [
    "Distributed SQLite edge replication and fast local-first sync protocol",
    "Automated cloud cost anomaly detector and AWS Kubernetes rightsizer",
    "Postgres query slow-log AI analyzer with index recommendation engine",
    "Zero-config webhook delivery infrastructure with automatic retries and dead-letters",
    "Ephemeral staging environment provisioner for pull requests on microservices"
  ]},
  { name: "Cybersecurity & RegTech", weight: 10, descriptions: [
    "GDPR subject access request (DSAR) discovery and redaction workflow",
    "Third-party vendor security risk assessment and vendor questionnaire automation",
    "Automated phishing resilience simulation and contextual security training"
  ]},
  { name: "Sales & MarTech", weight: 6, descriptions: [
    "Interactive product demo sandbox builder for B2B enterprise sales engineers",
    "Customer video testimonial collector with auto-transcription and social widgets"
  ]},
  { name: "Consumer & Agency Utility", weight: 4, descriptions: [
    "Social media carousel design generator with scheduled cross-posting",
    "Freelance client portal and retainer invoicing widget"
  ]}
];

const TECH_CATALOG = [
  ["React", "Node.js", "PostgreSQL", "AWS", "Tailwind CSS"],
  ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Vercel"],
  ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
  ["Ruby on Rails", "PostgreSQL", "Sidekiq", "Redis", "Heroku"],
  ["Vue.js", "Go", "PostgreSQL", "GCP", "Tailwind CSS"],
  ["React", "Django", "PostgreSQL", "AWS ECS", "Celery"],
  ["Angular", "Node.js", "MongoDB", "Express", "AWS"],
  ["PHP", "Laravel", "MySQL", "Tailwind CSS", "Forge"],
  ["PHP", "WordPress API", "jQuery", "Apache", "cPanel"], // Legacy tech test
];

const NAME_PREFIXES = [
  "Stack", "Flow", "Apex", "Omni", "Velo", "Pulse", "Nova", "Kite", "Forge", "Grid",
  "Sync", "Terra", "Aero", "Loom", "Helm", "Dock", "Trace", "Beacon", "Cortex", "Veritas",
  "Clarity", "Strata", "Axiom", "Vector", "Echo", "Nidus", "Prism", "Relay", "Shift", "Vault"
];

const NAME_SUFFIXES = [
  "Ops", "Flow", "Sync", "Pulse", "HQ", "Desk", "Hub", "Kit", "Works", "Base",
  "Engine", "Metrics", "Logic", "Point", "Path", "Nest", "Scale", "Track", "Pilot", "Forge"
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateLeads(count: number = 320): RawSeedLead[] {
  const leads: RawSeedLead[] = [];
  const generatedNames = new Set<string>();

  // 1. Generate base realistic leads
  for (let i = 0; i < count - 25; i++) {
    let baseName = `${pickRandom(NAME_PREFIXES)}${pickRandom(NAME_SUFFIXES)}`;
    while (generatedNames.has(baseName)) {
      baseName = `${pickRandom(NAME_PREFIXES)}${pickRandom(NAME_SUFFIXES)}${randInt(1, 99)}`;
    }
    generatedNames.add(baseName);

    const categoryObj = pickRandom(CATEGORIES);
    const category = categoryObj.name;
    const description = pickRandom(categoryObj.descriptions);

    const tld = Math.random() < 0.65 ? ".io" : Math.random() < 0.85 ? ".com" : ".co";
    const domain = `${baseName.toLowerCase()}${tld}`;
    const websiteUrl = `https://${domain}`;

    // Team size distribution centered around ETA sweet-spot 5-30
    let teamSize: number;
    const teamRoll = Math.random();
    if (teamRoll < 0.15) {
      teamSize = randInt(2, 4); // small/early
    } else if (teamRoll < 0.70) {
      teamSize = randInt(5, 28); // ideal search fund sweet spot
    } else if (teamRoll < 0.90) {
      teamSize = randInt(29, 45); // medium
    } else {
      teamSize = randInt(46, 75); // large
    }

    // Founded year: 2013 to 2023 (1 to 11 years vintage)
    const foundedYear = randInt(2014, 2022);

    // Revenue distribution matching team size & ETA mandate ($500k to $5M)
    const arrPerEmp = randInt(95000, 160000);
    const estMid = Math.round((teamSize * arrPerEmp) / 50000) * 50000;
    const estimatedArrMin = Math.max(350000, Math.round(estMid * 0.8 / 50000) * 50000);
    const estimatedArrMax = Math.round(estMid * 1.25 / 50000) * 50000;
    const arrHintString = `$${(estimatedArrMin / 1000000).toFixed(1)}M - $${(estimatedArrMax / 1000000).toFixed(1)}M ARR`;

    // Tech stack
    const isLegacy = category === "Consumer & Agency Utility" && Math.random() < 0.4;
    const techStack = isLegacy ? TECH_CATALOG[8] : pickRandom(TECH_CATALOG);

    // Contact quality distribution
    const fName = pickRandom(FIRST_NAMES);
    const lName = pickRandom(LAST_NAMES);
    const contactRoll = Math.random();

    let contactName = `${fName} ${lName}`;
    let contactTitle = "Founder & CEO";
    let contactEmail = `${fName.toLowerCase()}@${domain}`;
    let contactType = "FOUNDER";

    if (contactRoll < 0.55) {
      contactType = "FOUNDER";
      contactTitle = Math.random() < 0.4 ? "Co-Founder & CEO" : "Founder & CEO";
      contactEmail = `${fName.toLowerCase()}@${domain}`;
    } else if (contactRoll < 0.75) {
      contactType = "C_LEVEL";
      contactTitle = pickRandom(["Co-Founder & CTO", "Chief Revenue Officer", "COO & Co-Founder"]);
      contactEmail = `${fName.toLowerCase()}.${lName.toLowerCase()}@${domain}`;
    } else if (contactRoll < 0.88) {
      contactType = "VP_DIRECTOR";
      contactTitle = pickRandom(["VP of Product", "Head of Growth", "Director of Engineering"]);
      contactEmail = `${fName.toLowerCase()}@${domain}`;
    } else {
      contactType = "GENERIC_INBOX";
      contactName = "General Inquiries";
      contactTitle = "Operations Team";
      contactEmail = Math.random() < 0.5 ? `hello@${domain}` : `contact@${domain}`;
    }

    // Website health
    const healthRoll = Math.random();
    let websiteStatus = "ONLINE";
    let httpStatusCode = 200;
    let sslValid = true;
    let responseTimeMs = randInt(120, 480);

    if (healthRoll > 0.96) {
      websiteStatus = "UNREACHABLE";
      httpStatusCode = 502;
      sslValid = false;
      responseTimeMs = 3500;
    } else if (healthRoll > 0.92) {
      websiteStatus = "REDIRECT";
      httpStatusCode = 301;
      responseTimeMs = randInt(250, 700);
    }

    leads.push({
      companyName: baseName,
      domain,
      websiteUrl,
      category,
      description,
      estimatedTeamSize: teamSize,
      foundedYear,
      estimatedArrMin,
      estimatedArrMax,
      arrHintString,
      techStack: techStack.join(";"),
      contactName,
      contactTitle,
      contactEmail,
      contactType,
      websiteStatus,
      httpStatusCode,
      sslValid,
      responseTimeMs,
    });
  }

  // 2. Add realistic Duplicate Clusters for Feature 2 Dedupe testing
  const DUPLICATE_SEEDS = [
    {
      origIndex: 0,
      dupName: "Get" + leads[0].companyName + " Inc.",
      dupDomain: "get" + leads[0].domain,
      dupEmail: "sales@get" + leads[0].domain,
      dupContactName: "Sales Inquiries",
      dupContactTitle: "Sales Rep",
      dupContactType: "GENERIC_INBOX"
    },
    {
      origIndex: 3,
      dupName: leads[3].companyName + " Technologies LLC",
      dupDomain: leads[3].domain.replace(".io", ".co"),
      dupEmail: "support@" + leads[3].domain.replace(".io", ".co"),
      dupContactName: "Support Desk",
      dupContactTitle: "Support Specialist",
      dupContactType: "GENERIC_INBOX"
    },
    {
      origIndex: 7,
      dupName: leads[7].companyName + " SaaS Platform",
      dupDomain: "app." + leads[7].domain,
      dupEmail: "admin@app." + leads[7].domain,
      dupContactName: "Admin User",
      dupContactTitle: "System Admin",
      dupContactType: "GENERIC_INBOX"
    },
    {
      origIndex: 12,
      dupName: leads[12].companyName + " Software",
      dupDomain: leads[12].domain,
      dupEmail: "info@" + leads[12].domain,
      dupContactName: "Info Desk",
      dupContactTitle: "Office Manager",
      dupContactType: "GENERIC_INBOX"
    },
    {
      origIndex: 18,
      dupName: leads[18].companyName + " Group",
      dupDomain: leads[18].domain.replace(".com", ".io"),
      dupEmail: "team@" + leads[18].domain.replace(".com", ".io"),
      dupContactName: "Team Inbox",
      dupContactTitle: "Customer Success",
      dupContactType: "GENERIC_INBOX"
    }
  ];

  for (const dup of DUPLICATE_SEEDS) {
    if (leads[dup.origIndex]) {
      const orig = leads[dup.origIndex];
      leads.push({
        companyName: dup.dupName,
        domain: dup.dupDomain,
        websiteUrl: `https://${dup.dupDomain}`,
        category: orig.category,
        description: orig.description,
        estimatedTeamSize: Math.max(1, orig.estimatedTeamSize - randInt(1, 3)),
        foundedYear: orig.foundedYear,
        estimatedArrMin: orig.estimatedArrMin,
        estimatedArrMax: orig.estimatedArrMax,
        arrHintString: orig.arrHintString,
        techStack: orig.techStack,
        contactName: dup.dupContactName,
        contactTitle: dup.dupContactTitle,
        contactEmail: dup.dupEmail,
        contactType: dup.dupContactType,
        websiteStatus: orig.websiteStatus,
        httpStatusCode: orig.httpStatusCode,
        sslValid: orig.sslValid,
        responseTimeMs: orig.responseTimeMs + 50,
      });
    }
  }

  return leads;
}

// Write to CSV
export function writeSeedCsv() {
  const leads = generateLeads(330);
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const csvHeader = [
    "Company Name",
    "Domain",
    "Website URL",
    "Category",
    "Description",
    "Estimated Team Size",
    "Founded Year",
    "Estimated ARR Min",
    "Estimated ARR Max",
    "ARR Hint",
    "Tech Stack",
    "Contact Name",
    "Contact Title",
    "Contact Email",
    "Contact Type",
    "Website Status",
    "HTTP Status",
    "SSL Valid",
    "Response Time (ms)"
  ].join(",");

  const csvRows = leads.map(l => [
    `"${l.companyName}"`,
    `"${l.domain}"`,
    `"${l.websiteUrl}"`,
    `"${l.category}"`,
    `"${l.description.replace(/"/g, '""')}"`,
    l.estimatedTeamSize,
    l.foundedYear,
    l.estimatedArrMin,
    l.estimatedArrMax,
    `"${l.arrHintString}"`,
    `"${l.techStack}"`,
    `"${l.contactName}"`,
    `"${l.contactTitle}"`,
    `"${l.contactEmail}"`,
    `"${l.contactType}"`,
    `"${l.websiteStatus}"`,
    l.httpStatusCode,
    l.sslValid,
    l.responseTimeMs
  ].join(","));

  const fullCsv = [csvHeader, ...csvRows].join("\n");
  const targetPath = path.join(dataDir, "seed-leads.csv");
  fs.writeFileSync(targetPath, fullCsv, "utf-8");
  console.log(`Successfully generated ${leads.length} seed leads at ${targetPath}`);
}

if (process.argv[1] && process.argv[1].includes("generate-seed")) {
  writeSeedCsv();
}
