import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, Mail, ChevronRight } from 'lucide-react';
import { ARTICLES, HELP_CATEGORIES } from '../lib/helpArticles';
import { Page, PageHeader, PageContent, PageSection } from '../components/layout/PageLayout';

// ── Simple Markdown renderer ──────────────────────────────────────────────────
function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  const boldify = (text: string) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>');

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-[20px] font-bold text-text-primary mt-8 mb-3 pb-2 border-b border-border-default">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-[16px] font-semibold text-text-primary mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="text-[14px] font-semibold text-text-secondary mt-4 mb-1.5">
          {line.slice(5)}
        </h4>
      );
    } else if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-2 my-4 pl-1 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-[14px] text-text-secondary leading-relaxed">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {j + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: boldify(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-2 my-4 pl-1 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-[14px] text-text-secondary leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-[9px] shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: boldify(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === '') {
      // skip blank lines
    } else {
      elements.push(
        <p
          key={i}
          className="text-[14px] text-text-secondary leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: boldify(line) }}
        />
      );
    }
    i++;
  }
  return elements;
}

// ── Article Page ──────────────────────────────────────────────────────────────
export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const article = ARTICLES.find(a => a.id === id);
  const catArticles = ARTICLES.filter(a => article && a.category === article.category && a.id !== id).slice(0, 3);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto pb-20 pt-20 px-4 text-center">
        <p className="text-[16px] font-semibold text-text-secondary mb-3">Article not found.</p>
        <button
          onClick={() => navigate('/help')}
          className="text-[13px] text-indigo-600 hover:underline"
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  const category = HELP_CATEGORIES.find(c => c.name === article.category);

  return (
    <Page>
      <PageHeader 
        title={article.title}
        breadcrumbs={
          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Help Center
          </button>
        }
      />
      <PageContent>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start pt-6">

        {/* ── Article Content ────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-surface-card border border-border-default rounded-[28px] p-8 md:p-12 shadow-sm max-w-[1000px]">

            {/* Meta badges */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${category?.bg} ${category?.color}`}>
                {article.category}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
                <Tag className="w-3.5 h-3.5" />{article.tag}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
                <Clock className="w-3.5 h-3.5" />{article.readTime}
              </span>
            </div>



            {/* Summary / Lead */}
            <p className="text-[15px] text-text-secondary leading-relaxed mb-8 pb-8 border-b border-border-default">
              {article.summary}
            </p>

            {/* Article Body */}
            <div className="article-content">
              {renderContent(article.content)}
            </div>

            {/* Feedback row */}
            <div className="mt-10 pt-6 border-t border-border-default flex items-center justify-between flex-wrap gap-3">
              <p className="text-[13px] text-text-secondary">Was this article helpful?</p>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 text-[13px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-card)] hover:bg-emerald-100 transition-colors">
                  Yes, thanks!
                </button>
                <button className="px-4 py-1.5 text-[13px] font-medium text-text-secondary bg-surface-secondary border border-border-default rounded-[var(--radius-card)] hover:bg-surface-hover transition-colors">
                  Not really
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-6">

          <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[15px] font-semibold mb-1 text-white">Still need help?</p>
              <p className="text-[12px] text-slate-300 mb-4 leading-relaxed">
                Our support team is available 24/7.
              </p>
              <a
                href="mailto:support@archrevenue.com"
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white py-2.5 px-4 rounded-[var(--radius-card)] text-[13px] font-semibold transition-colors"
              >
                <Mail className="w-4 h-4" /> Email Support
              </a>
            </div>
          </div>

          {/* Related Articles */}
          {catArticles.length > 0 && (
            <div className="bg-surface-card border border-border-default rounded-[24px] p-6 shadow-sm">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-4">
                More in {article.category}
              </h4>
              <div className="space-y-1">
                {catArticles.map(related => (
                  <button
                    key={related.id}
                    onClick={() => navigate(`/help/article/${related.id}`)}
                    className="w-full text-left flex items-start justify-between gap-2 py-2.5 px-3 rounded-[var(--radius-card)] text-[13px] font-medium text-text-secondary hover:text-indigo-600 hover:bg-indigo-50 transition-all group"
                  >
                    <span className="line-clamp-2 leading-snug">{related.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <button
            onClick={() => navigate('/help')}
            className="w-full text-center text-[13px] font-medium text-text-secondary hover:text-indigo-600 transition-colors py-2"
          >
            View all articles
          </button>
        </div>

      </div>
      </PageContent>
    </Page>
  );
}
