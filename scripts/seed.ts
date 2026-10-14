import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runSeed() {
  console.log("Starting LeadLens database seed...");
  const csvPath = path.resolve(process.cwd(), "data", "seed-leads.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`Seed CSV file not found at ${csvPath}. Run scripts/generate-seed.ts first.`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  console.log(`Parsed ${parsed.data.length} records from CSV.`);

  try {
    // Attempt Prisma database insertion if DATABASE_URL is available
    await prisma.$connect();
    console.log("Connected to database via Prisma. Clearing existing leads...");
    await prisma.lead.deleteMany();

    let inserted = 0;
    for (const raw of parsed.data as any[]) {
      if (!raw["Domain"]) continue;

      const companyName = String(raw["Company Name"] || "").trim();
      const domain = String(raw["Domain"] || "").trim();
      const normalizedDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
      const normalizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");

      const teamSize = Number(raw["Estimated Team Size"] || 10);
      const foundedYear = Number(raw["Founded Year"] || 2018);
      const currentYear = 2026;
      const companyAge = currentYear - foundedYear;

      const techStack = typeof raw["Tech Stack"] === "string" 
        ? raw["Tech Stack"].split(";").map((s: string) => s.trim())
        : ["React", "PostgreSQL"];

      await prisma.lead.create({
        data: {
          companyName,
          normalizedName,
          domain,
          normalizedDomain,
          websiteUrl: raw["Website URL"] || `https://${domain}`,
          category: raw["Category"] || "B2B Workflow",
          description: raw["Description"] || "",
          estimatedTeamSize: teamSize,
          foundedYear,
          companyAge,
          estimatedArrMin: raw["Estimated ARR Min"] ? Number(raw["Estimated ARR Min"]) : null,
          estimatedArrMax: raw["Estimated ARR Max"] ? Number(raw["Estimated ARR Max"]) : null,
          arrHintString: raw["ARR Hint"] || "",
          techStack,
          contactName: raw["Contact Name"] || "",
          contactTitle: raw["Contact Title"] || "",
          contactEmail: raw["Contact Email"] || "",
          contactType: raw["Contact Type"] || "UNKNOWN",
          websiteStatus: raw["Website Status"] || "ONLINE",
          httpStatusCode: raw["HTTP Status"] ? Number(raw["HTTP Status"]) : 200,
          sslValid: raw["SSL Valid"] !== false,
          responseTimeMs: raw["Response Time (ms)"] ? Number(raw["Response Time (ms)"]) : 250,
          overallScore: 0, // Recalculated dynamically
        },
      });
      inserted++;
    }

    console.log(`Successfully seeded ${inserted} leads into Postgres!`);
  } catch (err: any) {
    console.warn("Could not connect to live Postgres database. Fallback seed data in data/seed-leads.csv will be used by the app's local repository.", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
