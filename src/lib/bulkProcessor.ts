import Papa from 'papaparse';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Lead, SellerProfile } from './types';
import { scoreLead } from './ai';

export interface CsvRow {
  [key: string]: any;
}

export interface BulkImportProgress {
  total: number;
  completed: number;
  duplicatesSkipped: number;
  status: 'parsing' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// ─── Smart column normalizer ──────────────────────────────────────────────────
// Strips spaces, underscores, hyphens and lowercases so
// "company_name", "Company Name", "COMPANY NAME" all → "companyname"
const normalize = (s: string) => s.toLowerCase().replace(/[\s_\-\.]+/g, '');

type NormalizedRow = Record<string, string>;

const buildNormalizedRow = (raw: CsvRow): NormalizedRow => {
  const out: NormalizedRow = {};
  for (const key of Object.keys(raw)) {
    out[normalize(key)] = (raw[key] ?? '').toString().trim();
  }
  return out;
};

// Pick the first non-empty, non-placeholder value from a list of aliases.
const pick = (row: NormalizedRow, ...aliases: string[]): string => {
  for (const a of aliases) {
    const v = row[normalize(a)];
    if (v && v !== 'N/A' && v !== 'n/a' && v !== '-' && v !== '') return v;
  }
  return '';
};

// ─── Field resolvers — covers Apollo, LI Sales Nav, Clay, Hunter, custom ──────

const resolveCompany = (row: NormalizedRow): string =>
  pick(row,
    'company', 'company_name', 'company name',
    'organization', 'organization_name', 'organization name',
    'account', 'account_name', 'account name',
    'employer', 'business', 'business_name', 'business name',
    'linkedin_company',
  );

const resolveName = (row: NormalizedRow): string => {
  // 1. Explicit full-name columns
  const fullCol = pick(row,
    'full_name', 'fullname', 'full name',
    'name', 'contact_name', 'contact name',
    'person_name', 'person name',
    'decision_maker', 'decision maker', 'decision_m',
  );
  if (fullCol) return fullCol;

  // 2. First + Last combination
  const first = pick(row, 'first_name', 'firstname', 'first name');
  const last  = pick(row, 'last_name',  'lastname',  'last name');
  if (first || last) return `${first} ${last}`.trim();

  // 3. Fall back to company name so nothing shows as "Unknown"
  const company = resolveCompany(row);
  if (company) return company;

  return 'Unknown';
};

const resolveEmail = (row: NormalizedRow): string =>
  pick(row,
    'email', 'email_address', 'email address',
    'work_email', 'work email',
    'linkedin_prc_email', 'contact_email', 'business_email',
    'e_mail',
  );

const resolvePhone = (row: NormalizedRow): string =>
  pick(row,
    'phone', 'phone_number', 'phone number',
    'mobile', 'mobile_phone', 'mobile phone',
    'direct_phone', 'direct phone', 'cell',
  );

const resolveWebsite = (row: NormalizedRow): string =>
  pick(row,
    'website', 'website_url', 'website url',
    'company_website', 'company website',
    'url', 'domain', 'web',
  );

const resolveIndustry = (row: NormalizedRow): string =>
  pick(row,
    'industry', 'industry_vertical', 'sector',
    'company_industry', 'vertical', 'niche',
  );

const resolveJobTitle = (row: NormalizedRow): string =>
  pick(row,
    'job_title', 'job title', 'title',
    'position', 'role', 'designation',
    'current_title', 'current title', 'jobtitle',
  );

const resolveLinkedIn = (row: NormalizedRow): string =>
  pick(row,
    'linkedin', 'linkedin_url', 'linkedin url',
    'linkedin_profile', 'linkedin profile',
    'linkedin_prc', 'linkedin_pre', 'profile_url', 'li_url',
  );

const resolveCompanySize = (row: NormalizedRow): string =>
  pick(row,
    'employee_count', 'employee count', 'employees',
    'company_size', 'company size', 'headcount',
    'num_employees', 'number_of_employees', 'staff',
  );

const resolveRevenue = (row: NormalizedRow): string =>
  pick(row,
    'estimated_revenue', 'estimated revenue', 'revenue',
    'annual_revenue', 'annual revenue',
    'company_revenue', 'company revenue', 'arr', 'mrr',
  );

const resolveLocation = (row: NormalizedRow): string => {
  const hq      = pick(row, 'headquarters', 'hq', 'location', 'city', 'office');
  const country = pick(row, 'country', 'country_code', 'region', 'state');
  return [hq, country].filter(Boolean).join(', ');
};

// ─── Deduplication key ────────────────────────────────────────────────────────
const dedupKey = (email: string, name: string, company: string): string =>
  email
    ? email.toLowerCase()
    : `${name.toLowerCase()}|${company.toLowerCase()}`;

// ─── CSV parser ───────────────────────────────────────────────────────────────
export const parseCsv = (file: File): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as CsvRow[]),
      error: (error: any) => reject(error),
    });
  });
};

// ─── Main import entry point ──────────────────────────────────────────────────
export const startBulkImport = async (
  file: File,
  sellerProfile: SellerProfile | null,
  onProgress: (progress: BulkImportProgress) => void
) => {
  try {
    onProgress({ total: 0, completed: 0, duplicatesSkipped: 0, status: 'parsing' });
    const rows = await parseCsv(file);

    if (!auth.currentUser) throw new Error('Not authenticated');

    const batchId = crypto.randomUUID();
    const batchRef = doc(db, `users/${auth.currentUser.uid}/imports/${batchId}`);

    let completed = 0;
    let duplicatesSkipped = 0;

    onProgress({ total: rows.length, completed, duplicatesSkipped, status: 'processing' });

    // Build existing dedup set from Firestore
    const leadsSnap = await getDocs(query(collection(db, 'leads'), where('userId', '==', auth.currentUser.uid)));
    const existingKeys = new Set<string>();
    leadsSnap.forEach(d => {
      const data = d.data();
      if (data.email) existingKeys.add(data.email.trim().toLowerCase());
      if (data.fullName && data.company)
        existingKeys.add(`${data.fullName.toLowerCase()}|${data.company.toLowerCase()}`);
    });

    const validRows: NormalizedRow[] = [];
    for (const rawRow of rows) {
      const row     = buildNormalizedRow(rawRow);
      const email   = resolveEmail(row).toLowerCase();
      const name    = resolveName(row);
      const company = resolveCompany(row);
      const key     = dedupKey(email, name, company);

      if (existingKeys.has(key)) {
        duplicatesSkipped++;
      } else {
        existingKeys.add(key);
        if (email) existingKeys.add(email);
        validRows.push(row);
      }
    }

    onProgress({ total: rows.length, completed: 0, duplicatesSkipped, status: 'processing' });

    await setDoc(batchRef, {
      id: batchId,
      date: serverTimestamp(),
      totalLeads: rows.length,
      completed: 0,
      duplicatesSkipped,
      status: 'processing',
    });

    const CONCURRENCY = 2;
    let index = 0;

    const processRow = async (row: NormalizedRow) => {
      try {
        const fullName   = resolveName(row);
        const email      = resolveEmail(row);
        const phone      = resolvePhone(row);
        const company    = resolveCompany(row);
        const website    = resolveWebsite(row);
        const industry   = resolveIndustry(row);
        const jobTitle   = resolveJobTitle(row);
        const linkedIn   = resolveLinkedIn(row);
        const sizeRaw    = resolveCompanySize(row);
        const revenueRaw = resolveRevenue(row);
        const location   = resolveLocation(row);

        // Map employee count to enum
        const companySize = (() => {
          const n = parseInt(sizeRaw.replace(/[^0-9]/g, ''), 10);
          if (!n) return undefined;
          if (n <= 10)   return '1-10'     as const;
          if (n <= 50)   return '11-50'    as const;
          if (n <= 200)  return '51-200'   as const;
          if (n <= 1000) return '201-1000' as const;
          return '1000+' as const;
        })();

        // Store extra context in painPoint until dedicated Lead fields are added
        const extraContext = [
          jobTitle   && `Title: ${jobTitle}`,
          linkedIn   && `LinkedIn: ${linkedIn}`,
          sizeRaw    && `Employees: ${sizeRaw}`,
          revenueRaw && `Est. Revenue: ${revenueRaw}`,
          location   && `Location: ${location}`,
        ].filter(Boolean).join('\n');

        const leadData: Partial<Lead> = {
          fullName,
          email,
          phone,
          company,
          website,
          industry,
          companySize,
          monthlyRevenue: revenueRaw || undefined,
          painPoint: extraContext || undefined,
          status: 'new',
          userId: auth.currentUser!.uid,
          userEmail: auth.currentUser!.email!,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          activities: [
            { id: crypto.randomUUID(), action: 'Imported via CSV', timestamp: new Date() },
          ],
        };

        const leadsRef = collection(db, 'leads');
        const docRef   = await addDoc(leadsRef, leadData);
        const newLead: Lead = { ...leadData, id: docRef.id } as Lead;

        const result = await scoreLead(newLead, sellerProfile) as any;
        const freshResearch = result._freshResearch ?? null;
        delete result._freshResearch;

        const aiUpdates: any = {
          aiAnalysis: result,
          ...(freshResearch ? { research: freshResearch } : {}),
          updatedAt: serverTimestamp(),
          activities: [
            ...newLead.activities!,
            ...(freshResearch
              ? [{ id: crypto.randomUUID(), action: 'Website Intelligence Gathered', timestamp: new Date() }]
              : []),
            { id: crypto.randomUUID(), action: 'AI Bulk Analysis Generated', timestamp: new Date() },
          ],
        };

        await updateDoc(docRef, aiUpdates);
      } catch (err) {
        console.error('Failed to process CSV row:', err);
      } finally {
        completed++;
        onProgress({ total: rows.length, completed, duplicatesSkipped, status: 'processing' });

        if (completed % 5 === 0 || completed === validRows.length) {
          await updateDoc(batchRef, {
            completed,
            status: completed === validRows.length ? 'completed' : 'processing',
          });
        }
      }
    };

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(async () => {
        while (index < validRows.length) {
          const cur = index++;
          await processRow(validRows[cur]);
          await new Promise(r => setTimeout(r, 1000));
        }
      });
    }

    await Promise.all(workers.map(w => w()));
    await updateDoc(batchRef, { status: 'completed', completed });
    onProgress({ total: rows.length, completed, duplicatesSkipped, status: 'completed' });

  } catch (error: any) {
    onProgress({ total: 0, completed: 0, duplicatesSkipped: 0, status: 'failed', error: error.message });
  }
};
