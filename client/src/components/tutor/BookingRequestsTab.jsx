// src/components/tutor/BookingRequestsTab.jsx
import React from 'react';

const BookingRequestsTab = ({ bookings, onHandleAction }) => {
    return (
        <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#004aad' }}>
                Yêu Cầu Đặt Lịch ({bookings.filter(b => b.Status === 'pending').length})
            </h3>

            {bookings.length === 0 ? (
                <p style={{ textAlign: 'center', padding: 40, color: '#888', fontStyle: 'italic' }}>
                    Không có yêu cầu nào trong tuần này.
                </p>
            ) : (
                <table style={{ marginTop: 10, width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#004aad', color: 'white' }}>
                        <tr>
                            <th style={{ padding: 10 }}>Sinh viên</th>
                            <th style={{ padding: 10 }}>Lịch hẹn</th>
                            <th style={{ padding: 10 }}>Nội dung</th>
                            <th style={{ padding: 10 }}>Trạng thái</th>
                            <th style={{ padding: 10 }}>Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.BookingID}>
                                {/* Sinh viên */}
                                <td style={{ fontWeight: 'bold', color: '#004aad', padding: 10 }}>
                                    {b.StudentName}
                                </td>

                                {/* Thời gian */}
                                <td style={{ padding: 10 }}>
                                    Tuần {b.WeekNumber}, Thứ {b.DayOfWeek}, Tiết {b.StartPeriod}
                                    {b.EndPeriod !== b.StartPeriod ? `-${b.EndPeriod}` : ''}
                                </td>

                                {/* Nội dung */}
                                <td style={{ padding: 10, maxWidth: 300, wordBreak: 'break-word' }}>
                                    {b.Topic}
                                </td>

                                {/* Trạng thái */}
                                <td style={{ padding: 10 }}>
                                    <span
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            color: 'white',
                                            fontSize: 12,
                                            background:
                                                b.Status === 'confirmed'
                                                    ? 'green'
                                                    : b.Status === 'pending'
                                                    ? '#6c757d'
                                                    : b.Status === 'rescheduled'
                                                    ? 'orange'
                                                    : 'red'
                                        }}
                                    >
                                        {b.Status.toUpperCase()}
                                    </span>
                                </td>

                                {/* Hành động */}
                                <td style={{ padding: 10 }}>
                                    {b.Status === 'pending' && (
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button
                                                style={{
                                                    background: 'green',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => onHandleAction(b.BookingID, 'confirmed')}
                                            >
                                                ✅ Duyệt
                                            </button>

                                            <button
                                                style={{
                                                    background: '#fd7e14',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => onHandleAction(b.BookingID, 'rescheduled')}
                                            >
                                                ✏️ Đổi
                                            </button>

                                            <button
                                                style={{
                                                    background: 'red',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => onHandleAction(b.BookingID, 'rejected')}
                                            >
                                                ❌ Từ chối
                                            </button>
                                        </div>
                                    )}

                                    {b.Status === 'confirmed' && (
                                        <button
                                            style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: 4,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => onHandleAction(b.BookingID, 'rejected')}
                                        >
                                            Hủy bỏ
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default BookingRequestsTab;
