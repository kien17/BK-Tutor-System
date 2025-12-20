import { useEffect, useState } from 'react';
import axios from 'axios';

const ReviewTab = ({ tutorId }) => {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        if (tutorId) fetchReviews();
    }, [tutorId]);

    const fetchReviews = async () => {
        const token = localStorage.getItem('token');
        if (!token || !tutorId) return;

        try {
            const res = await axios.get(
                `http://localhost:5000/api/tutors/${tutorId}/reviews-with-booking`,
                { headers: { Authorization: token } }
            );
            setReviews(res.data.reviews || []);
            setAverageRating(
                res.data.averageRating
                    ? Number(res.data.averageRating).toFixed(1)
                    : 0
            );
        } catch (err) {
            console.error('Lỗi tải đánh giá:', err);
            setReviews([]);
            setAverageRating(0);
        }
    };

    const renderStars = (rating) => (
        <div className="text-yellow-400 text-lg">
            {'★'.repeat(rating)}
            {'☆'.repeat(5 - rating)}
        </div>
    );

    return (
        <div>
            <h3 className="text-pink-600 text-xl font-semibold mb-6">
                Đánh Giá Từ Sinh Viên
            </h3>

            {/* Average rating */}
            <div className="bg-gray-50 p-6 rounded-xl text-center mb-6 shadow-sm">
                <h2 className="text-5xl text-yellow-400 font-bold mb-2">
                    {averageRating || '0.0'}
                </h2>
                <div className="text-2xl mb-2">
                    {renderStars(Math.round(averageRating || 0))}
                </div>
                <p className="text-gray-500">
                    Dựa trên {reviews.length} đánh giá
                </p>
            </div>

            {/* Reviews list */}
            {reviews.length === 0 ? (
                <p className="text-center text-gray-400 italic py-10">
                    Chưa có đánh giá nào từ sinh viên.
                </p>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div
                            key={review.ReviewID}
                            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
                        >
                            <div className="flex justify-between mb-2">
                                <strong className="text-blue-900">
                                    {review.StudentName}
                                </strong>
                                <span className="text-gray-500 text-sm">
                                    {new Date(review.CreatedAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            <div className="text-gray-600 text-sm mb-2">
                                <strong>Buổi tư vấn:</strong>{' '}
                                Tuần {review.WeekNumber}, Thứ {review.DayOfWeek}, Tiết{' '}
                                {review.StartPeriod}
                                {review.EndPeriod !== review.StartPeriod
                                    ? `-${review.EndPeriod}`
                                    : ''}
                                <br />
                                <strong>Chủ đề:</strong> {review.Topic}
                            </div>

                            <div className="mb-2">
                                {renderStars(review.Rating)}
                            </div>

                            <p className="text-gray-800">
                                {review.Comment || (
                                    <em className="text-gray-400">
                                        Không có nhận xét
                                    </em>
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewTab;
