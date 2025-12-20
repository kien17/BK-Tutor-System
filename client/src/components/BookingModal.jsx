import React from 'react';
import { createPortal } from 'react-dom';

const BookingModal = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative transform transition-transform duration-200 scale-95 sm:scale-100 hover:scale-100"
                onClick={(e) => e.stopPropagation()} // tránh click đóng khi nhấn trong modal
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                    <h3 className="text-lg font-bold text-blue-700">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="mb-5 space-y-4">{children}</div>

                {/* Actions */}
                {actions && (
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default BookingModal;
