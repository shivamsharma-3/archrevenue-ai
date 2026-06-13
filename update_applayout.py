import re

file_path = 'g:/AI-Lead/src/layouts/AppLayout.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the giant render block with an Outlet that passes everything down
outlet_block = '''
  const contextValue = {
    leads, loading, search, setSearch, isModalOpen, setIsModalOpen,
    isImportModalOpen, setIsImportModalOpen, editingLead, setEditingLead,
    selectedLead, setSelectedLead, isDetailsPanelOpen, setIsDetailsPanelOpen,
    sellerProfile, setSellerProfile, showProfileWizard, setShowProfileWizard,
    aiScoringLoading, outreachRegenerating, bookingLoading, researchLoading,
    calendarConnected, setCalendarConnected, calendarConnecting, setCalendarConnecting,
    gmailConnected, setGmailConnected, gmailConnecting, setGmailConnecting,
    emailingLead, setEmailingLead, bookingPromptLead, setBookingPromptLead,
    showHelpTooltip, setShowHelpTooltip, showDirectoryMenu, setShowDirectoryMenu,
    showHint, setShowHint, filterFollowUpsDueToday, setFilterFollowUpsDueToday,
    filterHotOnly, setFilterHotOnly, filterUnanalyzed, setFilterUnanalyzed,
    selectedLeads, setSelectedLeads, handleAddOrEditLead, handleDelete, handleBulkDelete,
    toggleSelectLead, toggleSelectAll, handleExportCsv, handleBookMeeting,
    handleStatusChange, handleSendEmailSuccess, handleScoreLead, handleRegenerateOutreach,
    handleUpdateFollowUp, handleAddNote, handleResearchCompany, saveBookingSuccess,
    handleMigrateLegacyData, openEditModal, openDetailsPanel, handleKanbanStatusChange,
    filteredLeads, visibleIds, allVisibleSelected, someSelected, statusColors, stats, winRate
  };

  return (
    <Shell>
      <div className="relative z-20 h-screen overflow-y-auto overflow-x-hidden">
        {location.pathname !== '/settings' && (
          <div className="sticky top-0 z-40 p-4 pb-0 md:p-4 md:pb-0">
            <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 rounded-[24px] border border-white/[0.08] bg-[#0a0a0b]/60 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-[24px]" />
              
              <div className="flex items-center md:hidden relative z-10">
                 <div className="w-7 h-7 flex items-center justify-center mr-2">
                  <BrandLogo className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-white font-medium font-display text-lg">ArchRevenue</span>
              </div>
              <div className="hidden md:flex items-center space-x-4 relative z-10">
              <h1 className="text-[22px] font-semibold text-white tracking-tight">
                {location.pathname === '/dashboard' && 'Command Center'}
                {location.pathname === '/pipeline' && 'Pipeline'}
                {location.pathname === '/leads' && 'Leads'}
              </h1>
              <div className="flex items-center px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                <span className="text-[11px] font-medium text-green-500">Live Sync</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 relative z-10">
              <div className="relative w-72 text-zinc-400">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search leads, companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 bg-[#121214] border border-white/[0.04] rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 transition-all text-sm outline-none placeholder:text-zinc-600 text-zinc-200"
                />
              </div>
              <button onClick={() => exportLeadsToCSV(leads)} className="flex items-center justify-center py-2 px-4 rounded-xl text-sm font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors shadow-sm border border-white/[0.08] mr-1"><Download className="w-4 h-4 mr-1.5" />Export</button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center py-2 px-4 rounded-xl text-sm font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors shadow-sm border border-white/[0.08] mr-3"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Import CSV
              </button>
              <button 
                onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
                className="flex items-center justify-center py-2 px-4 rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Lead
              </button>
            </div>
            <div className="flex items-center space-x-2 md:hidden relative z-10">
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="p-1.5 text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors shadow-sm border border-white/[0.08]"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
                className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
               <button onClick={handleLogout} className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            </header>
          </div>
        )}
        <div className="p-4 md:p-8 pt-6">
          <Outlet context={contextValue} />
        </div>
      </div>
      
      {/* Modals and Overlays (Imported from AppLayout) */}
      <AnimatePresence>
        {isModalOpen && (
          <LeadFormModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingLead(null); }}
            onSubmit={handleAddOrEditLead}
            initialData={editingLead || undefined}
            title={editingLead ? 'Edit Lead' : 'Add New Lead'}
          />
        )}
        {isImportModalOpen && (
           <CsvImportModal
             isOpen={isImportModalOpen}
             onClose={() => setIsImportModalOpen(false)}
           />
        )}
        {isDetailsPanelOpen && selectedLead && (
          <LeadDetailsPanel
             lead={selectedLead}
             isOpen={isDetailsPanelOpen}
             onClose={() => setIsDetailsPanelOpen(false)}
             onUpdateStatus={(status) => handleStatusChange(selectedLead, status)}
             onScore={() => handleScoreLead(selectedLead)}
             isScoring={aiScoringLoading[selectedLead.id!]}
             onRegenerateOutreach={() => handleRegenerateOutreach(selectedLead)}
             isRegenerating={outreachRegenerating[selectedLead.id!]}
             onEdit={() => openEditModal(selectedLead)}
             onDelete={() => handleDelete(selectedLead.id!)}
             onScheduleMeeting={() => handleBookMeeting(selectedLead)}
             isScheduling={bookingLoading[selectedLead.id!]}
             onUpdateFollowUp={(date, status) => handleUpdateFollowUp(selectedLead, date, status)}
             onAddNote={(content) => handleAddNote(selectedLead, content)}
             onSendEmail={() => setEmailingLead(selectedLead)}
             onResearch={() => handleResearchCompany(selectedLead)}
             isResearching={researchLoading[selectedLead.id!]}
             sellerProfile={sellerProfile}
          />
        )}
        {showProfileWizard && (
          <CompanyProfileWizard
            isOpen={showProfileWizard}
            onClose={() => setShowProfileWizard(false)}
            existingProfile={sellerProfile}
          />
        )}
        {emailingLead && (
          <EmailReviewModal
             isOpen={!!emailingLead}
             onClose={() => setEmailingLead(null)}
             lead={emailingLead}
             onSendSuccess={(edited, msgId, threadId) => {
               handleSendEmailSuccess(edited, msgId, threadId);
               setEmailingLead(null);
             }}
             sellerProfile={sellerProfile}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn("pointer-events-auto px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border", toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}
            >
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TokenUpgradeModal 
        isOpen={!!tokenModalError} 
        onClose={() => setTokenModalError(null)} 
        errorMessage={tokenModalError || ''} 
      />

    </Shell>
  );
}
'''

# Find the start of the return statement
return_index = content.find('return (')
if return_index == -1:
    print("Could not find return statement")
else:
    # Replace everything from the return statement to the end
    new_content = content[:return_index] + outlet_block
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated AppLayout.tsx successfully")
