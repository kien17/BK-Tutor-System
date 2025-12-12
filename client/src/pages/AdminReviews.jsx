// src/pages/admin/AdminReviews.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminReviews = () => {
    const [tutors, setTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState('');
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState('0.0');
    const [loading, setLoading] = useState(false);

    // 1. Lấy danh sách tất cả giảng viên
    useEffect(() => {
        axios.get('http://localhost:5000/api/users')
            .then(res => {
                const tutorList = res.data.filter(u => u.Role === 'tutor');
                setTutors(tutorList);
                if (tutorList.length > 0) {
                    setSelectedTutor(tutorList[0].UserID); // Chọn mặc định giảng viên đầu tiên
                }
            })
            .catch(err => console.error('Lỗi lấy danh sách tutor:', err));
    }, []);

    // 2. Khi chọn giảng viên → Lấy đánh giá bằng API có sẵn
    useEffect(() => {
        if (!selectedTutor) return;

        setLoading(true);

        axios.get(`http://localhost:5000/api/tutors/${selectedTutor}/reviews-with-booking`, {
            headers: { Authorization: localStorage.getItem('token') }
        })
        .then(res => {
            setReviews(res.data.reviews || []);
            setAverageRating(
                res.data.averageRating 
                    ? Number(res.data.averageRating).toFixed(1) 
                    : '0.0'
            );
            setLoading(false);
        })
        .catch(err => {
            console.error('Lỗi tải đánh giá:', err);
            setReviews([]);
            setAverageRating('0.0');
            setLoading(false);
        });
    }, [selectedTutor]);

    // Hàm render sao
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <span
                key={i}
                style={{
                    color: i < rating ? '#ffc107' : '#e0e0e0',
                    fontSize: '28px',
                    marginRight: '2px'
                }}
            >
                ★
            </span>
        ));
    };

    // Helper: Chuyển thứ trong tuần
    const getDayName = (day) => {
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
        return days[day] || 'Không xác định';
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: '#004aad', marginBottom: '30px', textAlign: 'center' }}>
                Quản lý Phản hồi & Đánh giá Giảng viên
            </h1>

            {/* Chọn giảng viên */}
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <label style={{ fontWeight: 'bold', fontSize: '18px', marginRight: '15px' }}>
                    Chọn giảng viên:
                </label>
                <select
                    value={selectedTutor}
                    onChange={(e) => setSelectedTutor(e.target.value)}
                    style={{
                        padding: '12px 18px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        minWidth: '300px'
                    }}
                >
                    {tutors.map(tutor => (
                        <option key={tutor.UserID} value={tutor.UserID}>
                            {tutor.FullName} ({tutor.SchoolID || tutor.Username})
                        </option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Đang tải đánh giá...</p>
                </div>
            ) : (
                <>
                    {/* Tổng quan điểm trung bình */}
                    <div style={{
                        background: 'white', // đổi nền sang trắng
                        color: '#004aad',   // màu chữ chính để nổi bật trên nền sáng
                        padding: '30px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        marginBottom: '40px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' // shadow nhẹ hơn để hợp nền trắng
                    }}>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: '56px', fontWeight: 'bold', color: '#004aad' }}>
                            {averageRating}
                        </h2>
                        <div style={{ fontSize: '36px', marginBottom: '10px', color: '#ffc107' }}>
                            {renderStars(Math.round(parseFloat(averageRating)))}
                        </div>
                        <p style={{ fontSize: '18px', margin: 0, color: '#555' }}>
                            Dựa trên <strong>{reviews.length}</strong> đánh giá từ sinh viên
                        </p>
                    </div>

                    {/* Danh sách đánh giá */}
                    {reviews.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', fontStyle: 'italic', padding: 40 }}>
                            Chưa có đánh giá nào từ sinh viên.
                        </p>
                    ) : (
                        <div > {/* giới hạn chiều rộng */}
                            {reviews.map(review => (
                                <div key={review.ReviewID} style={{
                                    background: 'white',
                                    border: '1px solid #eee',
                                    borderRadius: 8,
                                    padding: 15,
                                    marginBottom: 15,
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <strong style={{ color: '#004aad' }}>{review.StudentName || 'Sinh viên ẩn danh'}</strong>
                                        <span style={{ color: '#666', fontSize: 14 }}>
                                            {new Date(review.CreatedAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 14, color: '#555', marginBottom: 10 }}>
                                        <strong>Buổi tư vấn:</strong> Tuần {review.WeekNumber}, {getDayName(review.DayOfWeek)}, Tiết {review.StartPeriod}{review.EndPeriod !== review.StartPeriod ? `-${review.EndPeriod}` : ''} <br />
                                        <strong>Chủ đề:</strong> {review.Topic || 'Không có chủ đề'}
                                    </div>

                                    <div style={{ marginBottom: 8 }}>
                                        {renderStars(review.Rating)}
                                    </div>

                                    <p style={{ margin: 0, color: '#333', lineHeight: 1.5 }}>
                                        {review.Comment || <em style={{ color: '#aaa' }}>Không có nhận xét</em>}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminReviews;