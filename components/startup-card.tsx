import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Cpu,
  Factory,
  FlaskConical,
  Gem,
  MapPin,
  Shirt,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { sectorOutlook } from "@/lib/showcase";
import { cn } from "@/lib/utils";

export type StartupCardData = {
  href: string;
  businessName: string;
  sector: string | null;
  speciality?: string;
  location?: string;
  founders?: string;
  highlights?: string[];
  readinessScore: number | null;
  imageUrl?: string;
  // "platform": a real MulaStream startup that passed all three gates. "sample": a demo profile.
  kind: "platform" | "sample";
};

const SECTOR_ICONS: Record<string, LucideIcon> = {
  AgriTech: Sprout,
  "Agro-Processing": FlaskConical,
  Retail: ShoppingBag,
  Manufacturing: Factory,
  "Textiles & Apparel": Shirt,
  "Crafts & Jewellery": Gem,
  FinTech: Cpu,
  EdTech: Cpu,
  HealthTech: Cpu,
};

// Premium gradients for the image tile, picked from the business name so each card keeps its colour.
const GRADIENTS = [
  "from-[#1a202c] via-[#2d3748] to-[#f97316]",
  "from-[#064e3b] via-[#065f46] to-[#f59e0b]",
  "from-[#0f172a] via-[#1e3a8a] to-[#38bdf8]",
  "from-[#7c2d12] via-[#c2410c] to-[#fbbf24]",
  "from-[#3b0764] via-[#6d28d9] to-[#f472b6]",
];

function gradientFor(name: string): string {
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

export function StartupCard({ startup }: { startup: StartupCardData }) {
  const Icon = (startup.sector && SECTOR_ICONS[startup.sector]) || TrendingUp;
  const score = startup.readinessScore === null ? null : Math.round(startup.readinessScore);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      {/* Image area: the business's own photo when provided, otherwise a branded gradient tile. */}
      <div className={cn("relative h-40 overflow-hidden bg-gradient-to-br", gradientFor(startup.businessName))}>
        {startup.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={startup.imageUrl} alt={startup.businessName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35)_0,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.2)_0,transparent_45%)]"
            />
            <Icon aria-hidden className="absolute -right-4 -bottom-6 h-36 w-36 rotate-[-12deg] text-white/15" />
            <span className="absolute bottom-4 left-5 text-5xl font-extrabold text-white/90 drop-shadow">
              {startup.businessName.charAt(0)}
            </span>
          </>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {startup.sector && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 backdrop-blur">
              <Icon className="h-3.5 w-3.5" /> {startup.sector}
            </span>
          )}
        </div>
        <span
          className={cn(
            "absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            startup.kind === "platform" ? "bg-emerald-500 text-white" : "bg-black/40 text-white backdrop-blur"
          )}
        >
          {startup.kind === "platform" ? (
            <>
              <BadgeCheck className="h-3.5 w-3.5" /> Verified DD Pack
            </>
          ) : (
            "Sample profile"
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-800">{startup.businessName}</h3>
        {startup.speciality && <p className="text-sm text-gray-500">{startup.speciality}</p>}

        {(startup.location || startup.founders) && (
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            {startup.location && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-orange-500" /> {startup.location}
              </p>
            )}
            {startup.founders && (
              <p className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-orange-500" /> {startup.founders}
              </p>
            )}
          </div>
        )}

        {startup.highlights && startup.highlights.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {startup.highlights.map((h) => (
              <li key={h} className="rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800">
                {h}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3">
          <div>
            <p className="text-[11px] font-medium text-gray-500">Readiness Score</p>
            <p className="text-lg font-bold text-slate-800">{score === null ? "Not assessed" : `${score}/100`}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Market Projection</p>
            <p className="flex items-center gap-1 text-sm leading-tight font-semibold text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" /> {sectorOutlook(startup.sector)}
            </p>
          </div>
        </div>
        {score !== null && (
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div
              className={cn("h-1.5 rounded-full", score >= 80 ? "bg-emerald-500" : "bg-orange-500")}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        )}

        <Link
          href={startup.href}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          View Full Profile &amp; DD <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
