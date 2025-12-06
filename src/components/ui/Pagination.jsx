import React from 'react';
import Button from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-slate-500 hover:text-primary disabled:opacity-30"
            >
                <ChevronLeft size={20} />
            </Button>

            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={clsx(
                        "w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200",
                        currentPage === page
                            ? "bg-primary text-white shadow-md shadow-primary/30"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                >
                    {page}
                </button>
            ))}

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-slate-500 hover:text-primary disabled:opacity-30"
            >
                <ChevronRight size={20} />
            </Button>
        </div>
    );
};

export default Pagination;
