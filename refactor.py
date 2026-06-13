import re

with open("src/components/LeadIntelligencePage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Define boundaries
before_grid = content[:content.find('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">')]
after_grid = content[content.find('</div>\n          </div>\n        </div>\n      </main>'):]

grid_content = content[content.find('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">'):content.find('</div>\n          </div>\n        </div>\n      </main>')]

# Extract sections
s1_start = grid_content.find('{/* Section 1: Revenue Intelligence */}')
s2_start = grid_content.find('{/* Section 2: Website Intelligence */}')
s3_start = grid_content.find('{/* Section 3: Outreach Center */}')
s5_start = grid_content.find('{/* Section 5: Follow-Up Center */}')
s4_start = grid_content.find('{/* Section 4: Sales Notes */}')
s15_start = grid_content.find('{/* Section 1.5: AI Tasks */}')
s6_start = grid_content.find('{/* Section 6: Activity Timeline */}')

s1_end = s2_start
s2_end = s3_start
s3_end = grid_content.find('</div>\n\n            {/* Right Column')
s5_end = s4_start
s4_end = s15_start
s15_end = s6_start
s6_end = grid_content.find('</div>\n          </div>') - len('</div>\n            ')

# Trim and get blocks
sec1 = grid_content[s1_start:s1_end].strip()
sec2 = grid_content[s2_start:s2_end].strip()
sec3 = grid_content[s3_start:s3_end].strip()
sec5 = grid_content[s5_start:s5_end].strip()
sec4 = grid_content[s4_start:s4_end].strip()
sec15 = grid_content[s15_start:s15_end].strip()
sec6 = grid_content[s6_start:s6_end].strip()

# Create tabs UI
tabs_ui = """
          {/* Tabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/40 border border-white/[0.08] rounded-2xl w-max relative z-20 backdrop-blur-md mb-8 shadow-inner">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center ${activeTab === 'overview' ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.05]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('workspace')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center ${activeTab === 'workspace' ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.05]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Workspace
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center ${activeTab === 'activity' ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.05]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </button>
            <button 
              onClick={() => setActiveTab('outreach')}
              className={`px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all flex items-center ${activeTab === 'outreach' ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.05]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Outreach
            </button>
          </div>
"""

overview_tab = f"""
          {{activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {sec1}
              </div>
              <div className="space-y-6">
                {sec2}
              </div>
            </div>
          )}}
"""

workspace_tab = f"""
          {{activeTab === 'workspace' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {sec4}
                {sec15}
              </div>
              <div className="space-y-6">
                {sec5}
              </div>
            </div>
          )}}
"""

activity_tab = f"""
          {{activeTab === 'activity' && (
            <div className="max-w-4xl space-y-6">
              {sec6}
            </div>
          )}}
"""

outreach_tab = f"""
          {{activeTab === 'outreach' && (
            <div className="max-w-4xl space-y-6">
              {sec3}
            </div>
          )}}
"""

new_content = before_grid + tabs_ui + overview_tab + workspace_tab + activity_tab + outreach_tab + "\n          " + after_grid

with open("src/components/LeadIntelligencePage.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Refactored layout successfully.")
