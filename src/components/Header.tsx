import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GhostIcon } from '../constants';
import { useAuth } from '../auth/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { token, logout } = useAuth();
  const location = useLocation();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  const isLandingPage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-white">
            <GhostIcon className="h-7 w-7 text-indigo-400" />
            <span>GhostCode</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {isLandingPage ? (
              <>
                <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-slate-300 hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" onClick={(e) => handleScroll(e, 'how-it-works')} className="text-slate-300 hover:text-white transition-colors">Docs</a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </a>
              </>
            ) : (
              <Link to="/#features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {token ? (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors">Dashboard</Link>
                <button onClick={logout} className="bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors">Log In</Link>
                <Link to="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Sign Up</Link>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden mt-4 animate-fade-in-scale origin-top">
            <div className="flex flex-col space-y-4 items-center">
              {isLandingPage && (
                <>
                  <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="text-slate-300 hover:text-white transition-colors">Features</a>
                  <a href="#how-it-works" onClick={(e) => handleScroll(e, 'how-it-works')} className="text-slate-300 hover:text-white transition-colors">Docs</a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">GitHub</a>
                </>
              )}
              <div className="w-full border-t border-slate-700 my-2"></div>
              {token ? (
                <>
                  <Link to="/dashboard" className="text-slate-300 hover:text-white w-full text-center">Dashboard</Link>
                  <button onClick={logout} className="bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors w-full">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white w-full text-center">Log In</Link>
                  <Link to="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors w-full text-center">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
