import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CropReport } from "@/lib/types";
import { ReportCard } from "@/components/chat/ReportCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, DocumentData } from "firebase/firestore";

/** Firestore Timestamp -> ms (for sorting only) */
function tsToMs(v: any): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v?.toDate === "function") return v.toDate().getTime(); // Firestore Timestamp
  if (typeof v?.seconds === "number") return v.seconds * 1000; // plain object
  return 0;
}

/** Firestore Timestamp -> ISO string (matches CropReport type) */
function tsToIso(v: any): string {
  const ms = tsToMs(v);
  if (!ms) return new Date().toISOString();
  return new Date(ms).toISOString();
}

function normalizeRiskLevel(level: any): CropReport["seasonRisk"]["level"] {
  const l = String(level || "").toLowerCase();
  if (l === "low") return "low";
  if (l === "medium") return "medium";
  if (l === "moderate") return "medium";
  if (l === "high") return "high";
  if (l === "critical") return "critical";
  if (l === "very high") return "critical";
  return "medium";
}

function normalizeStatus(status: any): CropReport["status"] {
  const s = String(status || "ready").toLowerCase();
  if (s === "ready" || s === "processing" || s === "pending") return s;
  return "ready";
}

function normalizeReport(docId: string, d: DocumentData): CropReport {
  const seasonRiskRaw = (d?.seasonRisk && typeof d.seasonRisk === "object") ? d.seasonRisk : {};
  const stageRisksRaw = Array.isArray(d?.stageRisks) ? d.stageRisks : [];

  return {
    id: docId,
    crop: String(d?.crop || ""),
    variety: String(d?.variety || d?.seed_type || ""),
    city: String(d?.city || d?.district || ""),
    state: String(d?.state || ""),
    sowingDate: String(d?.sowingDate || d?.sowing_date || d?.sw_date || ""),
    season: String(d?.season || ""),
    status: normalizeStatus(d?.status),

    seasonRisk: {
      score: Number(seasonRiskRaw?.score ?? 0),
      level: normalizeRiskLevel(seasonRiskRaw?.level),
    },

    stageRisks: stageRisksRaw.map((s: any) => ({
      stage: String(s?.stage || s?.name || ""),
      riskScore: Number(s?.riskScore ?? s?.score ?? 0),
      riskLevel: normalizeRiskLevel(s?.riskLevel ?? s?.level),
      contributors: Array.isArray(s?.contributors) ? s.contributors : [],
      recommendations: Array.isArray(s?.recommendations) ? s.recommendations : [],
    })),

    // ✅ IMPORTANT: these must be STRING (ISO), not numbers
    createdAt: tsToIso(d?.createdAt),
    updatedAt: tsToIso(d?.updatedAt),
  };
}

export default function Reports() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [reports, setReports] = useState<CropReport[]>([]);
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      setLoading(true);

      // NOTE: no orderBy here to avoid Firestore composite-index issues.
      const q = query(collection(db, "reports"), where("userId", "==", user.id));
      const snap = await getDocs(q);

      const normalized = snap.docs.map((docSnap) =>
        normalizeReport(docSnap.id, docSnap.data() as DocumentData)
      );

      // sort client-side by createdAt
      normalized.sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));

      setReports(normalized);
      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [user?.id]);

  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.crop.toLowerCase().includes(s) ||
          r.city.toLowerCase().includes(s) ||
          r.state.toLowerCase().includes(s)
      );
    }

    if (cropFilter !== "all") {
      filtered = filtered.filter((r) => r.crop === cropFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    return filtered;
  }, [reports, search, cropFilter, statusFilter]);

  const crops = useMemo(() => Array.from(new Set(reports.map((r) => r.crop))).filter(Boolean), [reports]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("reports")}</h1>
        <p className="text-muted-foreground">View and manage your crop reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_reports")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={cropFilter} onValueChange={setCropFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("filter_crop")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Crops</SelectItem>
            {crops.map((crop) => (
              <SelectItem key={crop} value={crop}>
                {crop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("filter_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("no_reports")}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("create_first")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
