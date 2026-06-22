export interface HelpArticle {
  id: string;
  category: string;
  tag: string;
  title: string;
  readTime: string;
  summary: string;
  content: string;
}

export const ARTICLES: HelpArticle[] = [
  // ── GETTING STARTED ──────────────────────────────────────────
  {
    id: 'gs-1',
    category: 'Getting Started',
    tag: 'Setup',
    title: 'How to Add Your First Lead to ArchRevenue',
    readTime: '3 min read',
    summary: 'Learn how to manually create a lead, fill in contact details, and kick off the AI analysis pipeline in under 60 seconds.',
    content: `## Adding Your First Lead\n\n**ArchRevenue** makes it effortless to capture and qualify leads from the moment you first interact with a prospect.\n\n### Step 1: Navigate to the Leads Page\nFrom the left sidebar, click on **Leads**. This is your central intelligence directory where every lead you create will live.\n\n### Step 2: Click "Add Lead"\nIn the top-right corner of the Leads page, click the **+ Add Lead** button. A slide-out form will appear.\n\n### Step 3: Fill in Contact Details\nComplete as many fields as you can. The more data you provide, the more accurate the AI scoring will be:\n- **Full Name** - The contact's full name.\n- **Email Address** - Used for outreach generation.\n- **Company Name** - Critical for AI company research.\n- **Company Website** - ArchRevenue uses this to scrape live data and produce insights.\n- **Job Title / Role** - Helps determine decision-making authority.\n\n### Step 4: Save and Score\nClick **Save Lead**. Your lead will appear in the directory immediately. Click the **AI Score** button to trigger an automatic analysis using your defined ICP and company profile.\n\n### Pro Tip\nConfigure your company profile in **Settings** first. The AI score is significantly more accurate when it can compare the lead against your ideal customer definition.`
  },
  {
    id: 'gs-3',
    category: 'Getting Started',
    tag: 'Pipeline',
    title: 'How to Use the Pipeline (Kanban) Board',
    readTime: '4 min read',
    summary: 'Understand how to move deals through stages, track revenue, and keep your sales process organized with the ArchRevenue visual pipeline board.',
    content: `## Managing Your Sales Pipeline\n\nThe **Pipeline** page in ArchRevenue gives you a bird's-eye view of every active deal and where it stands in your sales process.\n\n### Pipeline Stages\nYour pipeline includes these standard stages:\n- **New** - Freshly added leads not yet contacted.\n- **Contacted** - You have reached out at least once.\n- **Qualified** - The lead has shown genuine interest.\n- **Meeting Booked** - A discovery call or demo is scheduled.\n- **Proposal** - A proposal or contract has been sent.\n- **Won** - Deal closed successfully.\n- **Lost** - Deal did not convert.\n\n### Moving a Lead\nDrag any lead card from one column to the next. ArchRevenue will automatically update the lead's status.\n\n### Reading the Analytics Bar\nAt the top of the Pipeline page you will see summary analytics:\n- **Total Leads** by stage\n- **Conversion Rate** from New to Won\n- **Average Deal Velocity** (how long leads spend in each stage)`
  },
  {
    id: 'gs-4',
    category: 'Getting Started',
    tag: 'Setup',
    title: 'Setting Up Your Company Profile for AI Accuracy',
    readTime: '6 min read',
    summary: 'Your company profile is the brain behind every AI decision. Learn how to configure it correctly to unlock maximum scoring and outreach accuracy.',
    content: `## Configuring Your Company Profile\n\nThe **Company Profile** is the single most important configuration step in ArchRevenue. Every AI feature (scoring, research, and outreach generation) uses this data to make personalized decisions.\n\n### Why It Matters\nWithout a company profile, the AI scores leads generically. With a complete profile, the AI understands:\n- **Who your ideal customer is** (ICP)\n- **What problem you solve** (Primary Offer)\n- **What tone to use** when writing outreach\n- **What industries to prioritize**\n\n### How to Set It Up\n1. Go to **Settings** from the left sidebar.\n2. In the Company Profile section, click **Configure**.\n3. Work through each step of the wizard.\n\n### Step 1: Company Basics\nEnter your company name, industry, and a short description of what you do. Be specific. "We help B2B SaaS companies reduce churn by 30% through proactive success workflows" is better than "We do customer success."\n\n### Step 2: Your Primary Offer\nDescribe your core product or service and focus on the outcome, not the feature.\n\n### Step 3: Ideal Customer Profile (ICP)\nDefine your perfect customer by target industries and buyer personas.\n\n### Step 4: Outreach Preferences\nChoose your communication tone (Professional, Conversational, Direct) and specify any topics to include or avoid in AI-generated emails.\n\n### Updating Your Profile\nYou can update your profile at any time. Changes apply immediately to all new AI analyses.`
  },
  {
    id: 'gs-5',
    category: 'Getting Started',
    tag: 'Integrations',
    title: 'Connecting Your Gmail & Google Calendar',
    readTime: '4 min read',
    summary: 'Step-by-step instructions on linking your Google account so you can send AI-generated outreach directly from ArchRevenue.',
    content: `## Google Integration Setup\n\nTo unlock one-click email sending and calendar syncing, you need to connect your Google Workspace or Gmail account to ArchRevenue.\n\n### Supported Providers\nCurrently, we support:\n- **Google Workspace / Gmail**\n- **Google Calendar**\n\n### How to Connect\n1. Navigate to **Settings**.\n2. Scroll down to the **Integrations** section.\n3. Click **Connect** next to Gmail or Google Calendar.\n4. A secure OAuth window will pop up. Sign in with your Google account.\n5. Grant ArchRevenue the requested permissions.\n\n### Privacy and Security\nWe only request the specific scopes needed to function. Your OAuth tokens are stored securely using Firebase Authentication. ArchRevenue does not read your unrelated personal emails or access your contacts without permission.\n\n### Disconnecting Your Account\nYou can revoke access at any time by returning to the Integrations page and clicking **Disconnect**, or by revoking access directly from your Google security dashboard.`
  },
  {
    id: 'gs-8',
    category: 'Getting Started',
    tag: 'Leads',
    title: 'Filtering and Sorting Your Lead Directory',
    readTime: '3 min read',
    summary: 'Master the Lead Directory search and sorting tools to quickly find the exact prospects you need to follow up with.',
    content: `## Navigating the Lead Directory\n\nAs your database grows, finding the right leads quickly becomes essential. ArchRevenue provides powerful filtering tools.\n\n### The Search Bar\nThe global search bar at the top of the Leads page searches across:\n- Lead Name\n- Company Name\n- Email Address\n- Job Title\n\n### Quick Filters\nUse the dropdown menus above your lead list to filter by:\n- **Stage:** Show only leads in "Proposal" or "Contacted".\n- **Score:** Use the score filter to instantly show only hot or warm leads.\n\n### Bulk Actions\nYou can select multiple leads using the checkboxes on the left side of the table. Once selected, you can delete them in bulk or export them.`
  },
  {
    id: 'gs-11',
    category: 'Getting Started',
    tag: 'Activity',
    title: 'Logging Manual Notes and Timeline Events',
    readTime: '3 min read',
    summary: 'Keep a clean system of record. Learn how to manually log offline activities and notes to the lead timeline.',
    content: `## Logging Offline Activity\n\nWhile ArchRevenue tracks some things automatically, you can add manual context through the Account Timeline.\n\n### How to Log a Note\n1. Open a lead from the directory or pipeline.\n2. Scroll down to the **Account Timeline** section at the bottom of the page.\n3. Type your note in the input box.\n4. Select the note type (General, Call, Meeting, Objection, Follow-up).\n5. Click the **Add Note** button.\n\n### Why Logging Matters\nThe **AI Deal Coach** reads your notes. If you log important context from phone calls or meetings, the AI will factor that into its strategic advice. A well-maintained timeline ensures the AI gives you the best possible coaching.\n\n### Pinning Important Notes\nIf a specific note contains critical information (like budget constraints or a timeline), you can click the **Pin** icon on the note to keep it highlighted at the top of the feed.`
  },
  {
    id: 'gs-12',
    category: 'Getting Started',
    tag: 'Export',
    title: 'Exporting Your Data for Reporting',
    readTime: '2 min read',
    summary: 'Need to run advanced reports in Excel or share data with leadership? Here is how to export your ArchRevenue data securely.',
    content: `## Data Exporting\n\nYour data belongs to you. ArchRevenue makes it simple to export your entire lead database for external reporting or migration.\n\n### Exporting All Leads\n1. Navigate to the **Settings** page.\n2. Scroll down to the **Export Data** section.\n3. Click the **Export All Lead Data** button.\n4. A CSV file will immediately download to your device.\n\n### What is Included in the Export?\nThe CSV will include all standard contact fields (Name, Email, Company, Phone, Title), the current Pipeline Stage, the AI Score, and the creation date.\n\n### Exporting Specific Leads\nIf you only want to export a subset of leads, go to the **Leads** page, use the checkboxes to select the specific leads you want, and click the **Export** button in the bulk action bar that appears at the bottom of the screen.`
  },

  // ── AI FEATURES ───────────────────────────────────────────────
  {
    id: 'ai-1',
    category: 'AI Features',
    tag: 'Scoring',
    title: 'Understanding the AI Lead Score (0-100)',
    readTime: '5 min read',
    summary: 'Discover exactly what the AI score means, how it is calculated, and how to use it to prioritize your outreach for maximum ROI.',
    content: `## AI Lead Scoring Explained\n\nThe **AI Lead Score** is a number from 0 to 100 that represents how closely a lead matches your Ideal Customer Profile and how likely they are to convert based on available signals.\n\n### What the Score Means\n- **80 to 100** - Hot Lead. Prioritize immediately.\n- **60 to 79** - Good Fit. Worth engaging soon.\n- **40 to 59** - Moderate. May need nurturing.\n- **0 to 39** - Poor Fit. Low priority.\n\n### What the AI Analyzes\n**ICP Alignment** - How well does the lead's company match your defined target industries, company size, and buyer persona?\n\n**Company Health Signals** - By researching the company website and available web data, the AI looks for indicators like recent funding, hiring trends, or technology usage that suggest growth and buying power.\n\n**Buying Intent** - Does the company's positioning, job listings, or web content suggest they are in the market for a solution like yours?\n\n### How to Use the Score\n- **Filter your leads** by score using the filters in the directory.\n- **Do not ignore low scores blindly** - check the AI reasoning. Sometimes a good lead scores low due to missing data. Add the company website and re-score.\n- **Re-score regularly** - scores are not static. A lead may become more relevant after new information is added.\n\n### Improving Score Accuracy\nThe number one way to improve scoring accuracy is to have a fully configured **Company Profile** in your Settings. The more specific your ICP definition, the more precisely the AI can evaluate fit.`
  },
  {
    id: 'ai-2',
    category: 'AI Features',
    tag: 'Research',
    title: 'Automated Company Research: How It Works',
    readTime: '4 min read',
    summary: 'ArchRevenue AI automatically pulls live intelligence on every lead company so you walk into every call fully prepared, without hours of manual research.',
    content: `## Automated Company Research\n\nOne of ArchRevenue's most powerful features is its ability to automatically research a lead's company and surface key intelligence that helps you personalize your approach.\n\n### What the AI Researches\nWhen you trigger an analysis, the system automatically does the following:\n\n**Scrapes the Company Website** - The AI visits the company website and extracts what the company does (in plain English), their target market, key value propositions, and technology stack indicators.\n\n**Identifies Pain Points** - Based on their positioning, the AI identifies likely business challenges that your solution could address.\n\n**Generates a Summary** - A concise, human-readable intelligence brief is produced that summarizes everything you need to know about the company before reaching out.\n\n### How to View Research Results\n1. Click on any lead in your directory to open the **Lead Intelligence Workspace**.\n2. Review the **Executive Briefing** and **Company Intelligence Graph** panels.\n3. You will see the full AI-generated company brief, including pain points and buying signals.\n\n### Best Practices\n- Always add the company **website URL** when creating a lead. Research quality drops significantly without it.`
  },
  {
    id: 'ai-3',
    category: 'AI Features',
    tag: 'Outreach',
    title: 'Generating Hyper-Personalized Cold Emails with AI',
    readTime: '5 min read',
    summary: 'Learn how ArchRevenue generates cold outreach emails that do not sound like templates, using your company profile, lead research, and proven copywriting frameworks.',
    content: `## AI-Powered Outreach Generation\n\nCold email is one of the highest-ROI channels in B2B sales but only when it is personalized. ArchRevenue generates outreach that reads like it was written by your best SDR, not a robot.\n\n### How the AI Writes Your Email\nThe outreach generator pulls from three sources:\n\n**Your Company Profile** - Your offer, tone, and value proposition.\n\n**Lead Research** - The AI brief about the company's pain points and context.\n\n**Proven Email Frameworks** - Structures like PAS (Problem-Agitate-Solution).\n\nThe result is an email that opens with something specific to the company, bridges their pain point to your solution, and has a clear, low-friction call-to-action.\n\n### Generating an Email\n1. Open any lead to enter their workspace.\n2. Scroll down to the **Outreach Playbook** panel.\n3. If it hasn't been generated yet, ensure the lead has been analyzed.\n4. You can review the email draft directly in the panel and click **Send** if your Gmail is connected, or **Copy** to use it elsewhere.\n\n### Tips for Higher Reply Rates\n- **Edit the opener** to add a truly personal touch.\n- **Test different tones** - switch between Professional and Conversational in your company profile to see what resonates.`
  },
  {
    id: 'ai-4',
    category: 'AI Features',
    tag: 'Coaching',
    title: 'Using the AI Deal Coach to Close Stalled Deals',
    readTime: '4 min read',
    summary: 'The AI Deal Coach provides personalized, strategic advice for every deal in your pipeline, helping you identify objections, next steps, and winning tactics.',
    content: `## The AI Revenue Strategy\n\nEvery sales rep has experienced a deal going cold without knowing why. The **Revenue Strategy** (Deal Coach) gives you an expert, on-demand perspective for every lead in your pipeline.\n\n### What the Strategy Panel Does\nWhen you open the Revenue Strategy panel for a lead, the AI provides:\n1. **Deal Strength Analysis** - How strong the opportunity is.\n2. **Why It Will Close** - The most compelling reasons the prospect will buy.\n3. **Potential Objections** - Hidden risks or objections you need to prepare for.\n4. **Recommended Action** - Specific, tactical next steps to move the deal forward.\n\n### When to Use It\nThe Strategy panel is most powerful when:\n- A deal has been sitting in one stage for more than a week.\n- You have received a response but are not sure how to follow up.\n- You are about to get on a discovery or closing call and want prep notes.\n\n### Making the Most of the Strategy\nLog your interactions (calls, emails, meetings) in the **Account Timeline**. If the AI has access to your notes, its strategic advice will be significantly more accurate.`
  },
  {
    id: 'ai-6',
    category: 'AI Features',
    tag: 'Copywriting',
    title: 'Customizing the AI Tone of Voice',
    readTime: '3 min read',
    summary: 'Adjust how the AI speaks to match your personal brand. Learn the differences between Professional, Conversational, and Direct tones.',
    content: `## Mastering AI Tone\n\nThe tone of your outreach drastically affects reply rates. ArchRevenue allows you to globally set the tone the AI uses when generating emails.\n\n### Available Tones\n\n**Professional**\n- Best for: Enterprise sales, formal industries (Legal, Healthcare, Finance).\n- Characteristics: Polished vocabulary, respectful distance, structured formatting.\n\n**Conversational (Recommended)**\n- Best for: SaaS, Agencies, modern B2B.\n- Characteristics: Reads like a quick message from a colleague. Uses simpler words and a friendly but brief approach.\n\n**Direct / Punchy**\n- Best for: High-volume outbound, pitching busy executives (CEOs, Founders).\n- Characteristics: Extremely brief. Skips the pleasantries and gets straight to the value proposition and the ask.\n\n### How to Change the Tone\n1. Go to **Settings**.\n2. In the Company Profile section, click **Configure**.\n3. Proceed to the **Communication** step in the wizard.\n4. Select your preferred tone from the dropdown.\n5. Click **Finish**.\n\nAll future emails generated will instantly adopt this new tone.`
  },
  {
    id: 'ai-8',
    category: 'AI Features',
    tag: 'Troubleshooting',
    title: 'Why Did My Lead Score Low?',
    readTime: '3 min read',
    summary: 'A troubleshooting guide to help you understand why a seemingly good lead received a low AI score, and how to fix it.',
    content: `## Troubleshooting Low AI Scores\n\nIt can be frustrating when a prospect you know is a great fit receives an AI score of 35. Here is why that happens and how to fix it.\n\n### 1. The Website URL is Missing\nThe AI relies heavily on the company website to understand what the business does. If you only provide a company name, the AI has to guess their industry and size. **Fix:** Add the correct website URL and click Re-Score.\n\n### 2. Your ICP is Too Vague\nThe AI compares the lead against your Company Profile. If your ICP definition in Settings is empty or says something generic like "Any B2B company," the AI cannot determine if this specific lead is a high-priority fit. **Fix:** Go to Settings, reconfigure your Company Profile, and define your target industries explicitly.\n\n### 3. The Website Was Blocked\nSometimes, the AI scraper gets blocked by the prospect's website firewall. If the AI cannot read the website, it defaults to a lower, safer score.\n\n### 4. The Contact Lacks Authority\nIf you input a lead with the title "Sales Development Representative" but your ICP targets "VP of Sales," the AI will drastically lower the score because the contact lacks purchasing power. **Fix:** Ensure you are targeting decision-makers.`
  },

  // ── BILLING & ACCOUNT ─────────────────────────────────────────
  {
    id: 'billing-1',
    category: 'Billing & Account',
    tag: 'Tokens',
    title: 'Understanding AI Token Usage and Limits',
    readTime: '3 min read',
    summary: 'Every AI action in ArchRevenue consumes tokens. Here is a clear breakdown of token limits and what happens when you run out.',
    content: `## AI Token Usage Guide\n\n**Tokens** are the unit of AI compute power in ArchRevenue. Each AI action you perform consumes a certain number of tokens in the background.\n\n### Monitoring Your Usage\nGo to **Billing** in the left sidebar. You will see a visual progress bar showing consumption vs. limit, and how many tokens remain in your current billing period.\n\n### What Happens When You Run Out\nWhen your token limit is reached, AI analysis features will be temporarily paused until the next billing cycle resets your allowance, or until you upgrade your plan. You will not lose any lead data.\n\n### Plans and Token Limits\n- **Starter** - 50,000 tokens per month\n- **Pro** - 150,000 tokens per month\n- **Enterprise** - Unlimited tokens\n\nUpgrade your plan at any time from the **Billing** page.`
  },
  {
    id: 'billing-2',
    category: 'Billing & Account',
    tag: 'Subscription',
    title: 'Managing Your Subscription and Billing',
    readTime: '3 min read',
    summary: 'Learn how to upgrade or manage your ArchRevenue plan, and understand how billing cycles and invoices work.',
    content: `## Subscription Management\n\n### Viewing Your Current Plan\nGo to **Billing** in the sidebar to see your current plan, tokens used, and available upgrade options.\n\n### Upgrading Your Plan\n1. Navigate to **Billing**.\n2. Click **Upgrade Plan** on the tier you want.\n3. You will be directed to our secure Stripe checkout.\n4. Upgrades are effective immediately and your token limit increases right away.\n\n### Managing Payments\nTo view past invoices or cancel your subscription, click the **Manage Payments** button on the Billing page. This will take you securely to the Stripe Customer Portal where you have full control over your billing relationship.\n\n### Refund Policy\nWe offer a 14-day money-back guarantee for new subscriptions. Contact support to request a refund within that window.`
  },
  {
    id: 'billing-3',
    category: 'Billing & Account',
    tag: 'Payments',
    title: 'Updating Your Payment Method',
    readTime: '2 min read',
    summary: 'How to safely update the credit card on file for your ArchRevenue subscription via our Stripe billing portal.',
    content: `## Updating Payment Details\n\nArchRevenue partners with Stripe to securely handle all payment processing. We do not store your credit card information on our servers.\n\n### How to Change Your Card\n1. Navigate to the **Billing** page from the left sidebar.\n2. Click the **Manage Payments** button.\n3. You will be securely redirected to the Stripe Customer Portal.\n4. Click **Add payment method** to enter a new card.\n5. Once added, you can make it default or delete your old card.\n6. Click **Return to ArchRevenue**.\n\n### Failed Payments\nIf a subscription renewal fails due to an expired or declined card, your account will enter a grace period. You will receive an email notification prompting you to update your card.`
  },
  {
    id: 'billing-5',
    category: 'Billing & Account',
    tag: 'Account',
    title: 'Resetting Your Workspace (Deleting All Leads)',
    readTime: '2 min read',
    summary: 'Instructions on how to permanently delete all your lead data from our servers if you want to start fresh.',
    content: `## Deleting All Lead Data\n\nIf you want to completely clear out your workspace and start fresh, you can permanently delete all leads.\n\n### Important Warnings\n- **This action is irreversible.** Once your leads are deleted, all pipeline history, AI analyses, and generated emails are immediately wiped from our databases. They cannot be recovered.\n- **Billing is Not Cancelled:** This action only deletes your data. It does not cancel your subscription. To cancel billing, go to the Billing page.\n\n### How to Delete All Leads\n1. Go to **Settings**.\n2. Scroll down to the **Danger Zone** at the bottom of the page.\n3. Click the **Delete All Leads** button.\n4. You will be prompted to confirm this destructive action.\n5. Click **Delete Everything**.\n\nYour workspace will be completely emptied.`
  }
];

export const HELP_CATEGORIES = [
  {
    name: 'Getting Started',
    tag: 'teal',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-100',
    count: ARTICLES.filter(a => a.category === 'Getting Started').length,
  },
  {
    name: 'AI Features',
    tag: 'violet',
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-100',
    count: ARTICLES.filter(a => a.category === 'AI Features').length,
  },
  {
    name: 'Billing & Account',
    tag: 'amber',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    count: ARTICLES.filter(a => a.category === 'Billing & Account').length,
  },
];
