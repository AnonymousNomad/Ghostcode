import React from 'react';

const SkeletonRow = () => (
    <tr className="border-b border-slate-800 last:border-b-0">
        <td className="p-4">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        </td>
        <td className="p-4 hidden sm:table-cell">
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </td>
        <td className="p-4 hidden md:table-cell">
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
        </td>
        <td className="p-4">
            <div className="h-6 bg-slate-700 rounded w-16 ml-auto"></div>
        </td>
    </tr>
);


const SkeletonLoader: React.FC = () => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-left animate-pulse">
            <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
                <th className="p-4"><div className="h-4 bg-slate-700 rounded w-20"></div></th>
                <th className="p-4 hidden sm:table-cell"><div className="h-4 bg-slate-700 rounded w-24"></div></th>
                <th className="p-4 hidden md:table-cell"><div className="h-4 bg-slate-700 rounded w-16"></div></th>
                <th className="p-4 text-right"><div className="h-4 bg-slate-700 rounded w-20 ml-auto"></div></th>
            </tr>
            </thead>
            <tbody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
            </tbody>
        </table>
    </div>
  );
};

export default SkeletonLoader;