import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Clock, Tag, ChevronDown, Check } from 'lucide-react';
import { ARTICLES, HELP_CATEGORIES } from '../lib/helpArticles';
import { cn } from '../lib/utils';
import { Page, PageHeader, PageContent, PageActions } from '../components/layout/PageLayout';

export default function ArticleListPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Getting Started');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse hash on mount to set initial category
  useEffect(() => {
    if (hash) {
      const slug = hash.replace('#', '');
      const match = HELP_CATEGORIES.find(
        c => c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
      );
      if (match) {
        setActiveCategory(match.name);
      }
    }
  }, [hash]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredArticles = useMemo(() => {
    let list = ARTICLES;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    // If searching, we still group by category, but maybe the user wants to see results across all categories?
    // Let's keep it restricted to the active category unless they are searching, in which case we show search results for the active category.
    return list.filter(a => a.category === activeCategory);
  }, [searchQuery, activeCategory]);

  const currentCategoryData = HELP_CATEGORIES.find(c => c.name === activeCategory);

  return (
    <Page>
      <PageHeader 
        title="Help Articles" 
        description="Browse and search through our knowledge base."
        breadcrumbs={
          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 text-[13px] font-medium text-text-tertiary hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Help Center
          </button>
        }
      >
        <PageActions>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 w-full">
          
          {/* Category Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-surface-card border border-border-default hover:border-border-hover rounded-2xl py-3 px-5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", currentCategoryData?.bg)}>
                <span className={cn("text-[12px] font-bold", currentCategoryData?.color)}>{currentCategoryData?.count}</span>
              </div>
              <span className="text-[18px] font-bold text-text-primary">{activeCategory}</span>
              <ChevronDown className={cn("w-5 h-5 text-text-tertiary transition-transform duration-200 ml-2", dropdownOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-surface-card border border-border-default rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {HELP_CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      setDropdownOpen(false);
                      setSearchQuery('');
                      // Update URL hash without jumping
                      window.history.replaceState(null, '', `#${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary transition-colors",
                      activeCategory === cat.name ? "bg-indigo-50/50" : ""
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", cat.bg)}>
                        <span className={cn("text-[11px] font-bold", cat.color)}>{cat.count}</span>
                      </div>
                      <span className={cn("text-[14px] font-semibold", activeCategory === cat.name ? "text-indigo-900" : "text-text-secondary")}>
                        {cat.name}
                      </span>
                    </div>
                    {activeCategory === cat.name && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-tertiary group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder={`Search in ${activeCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-surface-card border border-border-default rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
            </div>
          </div>
        </PageActions>
      </PageHeader>
      
      <PageContent>
      {/* ── Articles Grid ─────────────────────────────────────────────────── */}
      <div>
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-surface-card border border-border-default rounded-[24px]">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-[16px] font-semibold text-text-secondary">No articles found</p>
            <p className="text-[14px] text-text-tertiary mt-1">Try a different search query in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <button
                key={article.id}
                onClick={() => navigate(`/help/article/${article.id}`)}
                className="text-left bg-surface-card border border-border-default rounded-[24px] p-6 hover:border-indigo-200 hover:shadow-md transition-all group flex flex-col h-full"
              >
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold text-text-primary group-hover:text-indigo-600 transition-colors mb-3 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-[13px] text-text-tertiary leading-relaxed line-clamp-3 mb-5">
                    {article.summary}
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-border-default mt-auto">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-text-tertiary">
                    <Tag className="w-3.5 h-3.5" /> {article.tag}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-text-tertiary">
                    <Clock className="w-3.5 h-3.5" /> {article.readTime}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      </PageContent>
    </Page>
  );
}
