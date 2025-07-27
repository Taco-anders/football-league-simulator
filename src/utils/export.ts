// Export utility functions
export const exportLeagueData = (league: any) => {
  const dataStr = JSON.stringify(league, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${league.name.replace(/\s+/g, '_')}_export.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};
// Export project structure as text
export const exportProjectStructure = () => {
  const projectInfo = {
    name: "Football League Simulator",
    description: "React TypeScript application for simulating football leagues",
    lastUpdated: new Date().toISOString(),
    changedFiles: [
      "src/types/index.ts - Added new statistics types",
      "src/utils/statistics.ts - Added new statistics calculations", 
      "src/components/StatisticsView.tsx - Added new statistics views"
    ],
    instructions: [
      "1. Copy each file manually from Bolt interface",
      "2. Pay special attention to the files listed in changedFiles",
      "3. Test the new statistics features after copying",
      "4. Commit changes to your Git repository"
    ]
  };
  
  const dataStr = JSON.stringify(projectInfo, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', 'project_export_info.json');
  linkElement.click();
  
  console.log('Project structure exported. Check your downloads folder.');
};
export const exportProjectFiles = () => {
  console.log('🚨 Export function missing in current Bolt version');
  console.log('📋 Manual copy required for these key files:');
  console.log('   - src/types/index.ts');
  console.log('   - src/utils/statistics.ts');
  console.log('   - src/components/StatisticsView.tsx');
  
  // Export project info instead
  exportProjectStructure();
};