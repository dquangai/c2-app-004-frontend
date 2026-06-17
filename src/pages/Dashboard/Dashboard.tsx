import React from 'react';
import { Sidebar } from '../../components/Sidebar';
import { SearchBar } from '../../components/SearchBar';
import { ChatBubbles } from '../../components/ChatBubbles';
import { ProfessionalCard } from '../../components/ProfessionalCard';
import { ReputationCard } from '../../components/ReputationCard';
import { MatchReasonCard } from '../../components/MatchReasonCard';
import { CommunityStatsCard } from '../../components/CommunityStatsCard';
import { BottomActionBar } from '../../components/BottomActionBar';
import { professionals } from '../../data/mockData';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex bg-background">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-60 mr-80 flex-1 p-8 pb-32">
        <SearchBar />
        <ChatBubbles />

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Đề xuất cho bạn</h2>
        <div className="space-y-6">
          {professionals.map((prof) => (
            <ProfessionalCard key={prof.id} professional={prof} />
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 fixed right-0 top-0 bottom-0 bg-white border-l border-gray-200 overflow-y-auto p-6">
        <ReputationCard />
        <MatchReasonCard />
        <CommunityStatsCard />
      </div>

      {/* Bottom Action Bar */}
      <BottomActionBar />
    </div>
  );
};
