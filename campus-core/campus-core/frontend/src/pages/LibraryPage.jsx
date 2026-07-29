import React from 'react';
import { BookOpen, Search, Clock, BookMarked, Library, Bookmark, Globe } from 'lucide-react';
import { FadeInOnScroll, StaggerContainer, StaggerItem, AnimatedGradientText, CircuitBackground } from '../components/AnimationWrappers';
import EmptyState from '../components/EmptyState';

/**
 * LibraryPage — Placeholder public library page
 * Styled consistently with the CampusCore redesign system.
 */
export default function LibraryPage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Digital Catalog',
      description: 'Browse our extensive collection of textbooks, research papers, and academic journals available in the campus library system.',
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find resources instantly using our AI-powered search engine. Filter by department, author, subject, or publication year.',
      color: 'text-indigo-400 bg-indigo-500/10',
    },
    {
      icon: Clock,
      title: 'Real-Time Availability',
      description: 'Check real-time availability of books and study materials. Reserve items directly from the portal before visiting.',
      color: 'text-purple-400 bg-purple-500/10',
    },
    {
      icon: BookMarked,
      title: 'Reading History',
      description: 'Track your complete borrowing history, reading lists, and personalized recommendations based on your academic profile.',
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      icon: Globe,
      title: 'E-Resources',
      description: 'Access thousands of e-books, online databases, and digital archives from partner institutions worldwide.',
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      icon: Bookmark,
      title: 'Study Spaces',
      description: 'Reserve study rooms, collaborative spaces, and quiet zones. View live occupancy and upcoming availability.',
      color: 'text-rose-400 bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-12 py-6">
      {/* Hero */}
      <FadeInOnScroll>
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
            <Library className="h-3.5 w-3.5" />
            <span>Campus Library System</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Your Gateway to{' '}
            <AnimatedGradientText>Knowledge</AnimatedGradientText>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Access the complete CampusCore library ecosystem — from physical book catalogs to digital archives, 
            study space reservations, and AI-powered reading recommendations.
          </p>
        </div>
      </FadeInOnScroll>

      {/* Feature Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <StaggerItem key={idx}>
              <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 hover-scale hover-glow transition-all flex flex-col items-start space-y-4 h-full">
                <div className={`p-3 rounded-xl ${feature.color} border border-white/5`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">{feature.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Catalog Preview — Empty State */}
      <FadeInOnScroll delay={0.2}>
        <div className="glass-card rounded-2xl p-6 border border-slate-900 bg-slate-900/10">
          <h3 className="text-sm font-bold text-slate-250 mb-2 flex items-center space-x-2 border-b border-slate-900 pb-2">
            <BookOpen className="h-4.5 w-4.5 text-blue-400" />
            <span>Library Catalog</span>
          </h3>
          <EmptyState
            icon={BookOpen}
            title="Catalog Coming Soon"
            description="The full digital library catalog will be integrated here. Log in to the student portal to access your existing library dashboard."
          />
        </div>
      </FadeInOnScroll>
    </div>
  );
}
