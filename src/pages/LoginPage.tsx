import React from 'react';
import Login from '../components/Login';
import { GhostIcon } from '../constants';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2]"></div>
            <div className="relative z-10 flex flex-col items-center">
                <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-white mb-8">
                    <GhostIcon className="h-8 w-8 text-indigo-400" />
                    <span>GhostCode</span>
                </Link>
                <div className="w-full max-w-sm bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    <Login />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
