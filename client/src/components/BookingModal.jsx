import React from 'react';

const BookingModal = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose} // Click vào backdrop sẽ đóng modal
        >
            <div
                style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    width: '90%',
                    maxWidth: '500px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    animation: 'fadeIn 0.2s',
                }}
                onClick={(e) => e.stopPropagation()} // Ngăn click bên trong modal lan ra backdrop
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 15,
                        borderBottom: '1px solid #eee',
                        paddingBottom: 10,
                    }}
                >
                    <h3 style={{ margin: 0, color: '#004aad' }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ marginBottom: 20 }}>{children}</div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>{actions}</div>
            </div>
        </div>
    );
};

export default BookingModal;
