import React from 'react';
import axios from 'axios';

const DAYS = [2, 3, 4, 5, 6, 7, 8];
const PERIODS = Array.from({ length: 17 }, (_, i) => i + 1);

const CreateInterviewTab = ({ interviewForm, setInterviewForm, onSuccess }) => {
    const handleCreateInterview = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            await axios.post(
                'http://localhost:5000/api/tutor/interview',
                {
                    studentEmails: interviewForm.emails,
                    week: interviewForm.week,
                    day: interviewForm.day,
                    startPeriod: interviewForm.startPeriod,
                    endPeriod: interviewForm.startPeriod,
                    topic: interviewForm.topic,
                    location: interviewForm.location,
                    meetingMode: interviewForm.mode,
                },
                { headers: { Authorization: token } }
            );

            alert('Đã tạo buổi tư vấn nhóm thành công!');
            setInterviewForm({ ...interviewForm, emails: '' });
            if (onSuccess) onSuccess();

        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi tạo tư vấn');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h2 className="text-center text-2xl font-bold text-[#004aad] mb-6">
                Tạo Buổi Tư Vấn Nhóm
            </h2>

            <form onSubmit={handleCreateInterview} className="flex flex-col gap-6">

                {/* EMAIL LIST */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-gray-700 font-semibold mb-2">Danh sách Email</label>
                    <textarea
                        required
                        placeholder="sv1@hcmut.edu.vn, sv2@hcmut.edu.vn"
                        value={interviewForm.emails}
                        onChange={(e) => setInterviewForm({ ...interviewForm, emails: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none h-20"
                    />
                    <p className="mt-1 text-gray-500 text-xs">Nhập nhiều email, cách nhau bằng dấu phẩy.</p>
                </div>

                {/* MODE + LOCATION */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-gray-700 font-semibold mb-2">Hình thức</label>
                        <select
                            value={interviewForm.mode}
                            onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                            <option value="Online">Online</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>

                    <div className="flex-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-gray-700 font-semibold mb-2">Địa điểm / Link</label>
                        <input
                            type="text"
                            value={interviewForm.location}
                            onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                            placeholder="Nhập phòng học hoặc link Google Meet..."
                            className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                </div>

                {/* WEEK / DAY / PERIOD */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <label className="block text-gray-700 font-semibold mb-1">Tuần</label>
                        <select
                            value={interviewForm.week}
                            onChange={(e) => setInterviewForm({ ...interviewForm, week: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                            {[...Array(20)].map((_, i) => (
                                <option key={i} value={i + 1}>Tuần {i + 1}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <label className="block text-gray-700 font-semibold mb-1">Thứ</label>
                        <select
                            value={interviewForm.day}
                            onChange={(e) => setInterviewForm({ ...interviewForm, day: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                            {DAYS.map((d) => (
                                <option key={d} value={d}>Thứ {d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <label className="block text-gray-700 font-semibold mb-1">Tiết</label>
                        <select
                            value={interviewForm.startPeriod}
                            onChange={(e) => setInterviewForm({ ...interviewForm, startPeriod: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                            {PERIODS.map((p) => (
                                <option key={p} value={p}>Tiết {p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TOPIC */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-gray-700 font-semibold mb-2">Chủ đề</label>
                    <input
                        type="text"
                        value={interviewForm.topic}
                        onChange={(e) => setInterviewForm({ ...interviewForm, topic: e.target.value })}
                        placeholder="Nhập chủ đề buổi tư vấn"
                        className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                    type="submit"
                    className="bg-[#004aad] hover:bg-[#003580] text-white font-semibold text-sm rounded-lg py-3 px-6 transition-colors"
                >
                    Tạo Lịch & Gửi Thông Báo
                </button>
            </form>
        </div>
    );
};

export default CreateInterviewTab;
