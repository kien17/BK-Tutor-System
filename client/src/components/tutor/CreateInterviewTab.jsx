// src/components/CreateInterviewTab.jsx
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
        <div style={styles.container}>
            <h2 style={styles.title}>📘 Tạo Buổi Tư Vấn Nhóm</h2>

            <form onSubmit={handleCreateInterview} style={styles.form}>
                
                {/* EMAIL LIST */}
                <div style={styles.card}>
                    <label style={styles.label}>Danh sách Email</label>
                    <textarea
                        required
                        placeholder="sv1@hcmut.edu.vn, sv2@hcmut.edu.vn"
                        value={interviewForm.emails}
                        onChange={(e) => setInterviewForm({ ...interviewForm, emails: e.target.value })}
                        style={styles.textarea}
                    />
                    <p style={styles.helper}>Nhập nhiều email, cách nhau bằng dấu phẩy.</p>
                </div>

                {/* MODE + LOCATION */}
                <div style={styles.row}>
                    <div style={{ ...styles.card, flex: 1 }}>
                        <label style={styles.label}>Hình thức</label>
                        <select
                            style={styles.input}
                            value={interviewForm.mode}
                            onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })}
                        >
                            <option value="Online">Online</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>

                    <div style={{ ...styles.card, flex: 2 }}>
                        <label style={styles.label}>Địa điểm / Link</label>
                        <input
                            type="text"
                            value={interviewForm.location}
                            onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* WEEK / DAY / PERIOD */}
                <div style={styles.row}>
                    <div style={styles.cardSmall}>
                        <label style={styles.label}>Tuần</label>
                        <select
                            style={styles.input}
                            value={interviewForm.week}
                            onChange={(e) => setInterviewForm({ ...interviewForm, week: e.target.value })}
                        >
                            {[...Array(20)].map((_, i) => (
                                <option key={i} value={i + 1}>Tuần {i + 1}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.cardSmall}>
                        <label style={styles.label}>Thứ</label>
                        <select
                            style={styles.input}
                            value={interviewForm.day}
                            onChange={(e) => setInterviewForm({ ...interviewForm, day: e.target.value })}
                        >
                            {DAYS.map((d) => (
                                <option key={d} value={d}>Thứ {d}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.cardSmall}>
                        <label style={styles.label}>Tiết</label>
                        <select
                            style={styles.input}
                            value={interviewForm.startPeriod}
                            onChange={(e) => setInterviewForm({ ...interviewForm, startPeriod: e.target.value })}
                        >
                            {PERIODS.map((p) => (
                                <option key={p} value={p}>Tiết {p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TOPIC */}
                <div style={styles.card}>
                    <label style={styles.label}>Chủ đề</label>
                    <input
                        type="text"
                        value={interviewForm.topic}
                        onChange={(e) => setInterviewForm({ ...interviewForm, topic: e.target.value })}
                        style={styles.input}
                    />
                </div>

                {/* SUBMIT BUTTON */}
                <button type="submit" style={styles.button}>Tạo Lịch & Gửi Thông Báo</button>
            </form>
        </div>
    );
};

export default CreateInterviewTab;

// ======================
// 🎨 CSS-IN-JS STYLES
// ======================

const styles = {
    container: {
        maxWidth: 650,
        margin: "0 auto",
        padding: 25,
        background: "white",
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    },
    title: {
        textAlign: "center",
        marginBottom: 20,
        color: "#004aad",
        fontWeight: "700",
        fontSize: "24px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },
    card: {
        background: "#f8faff",
        padding: 15,
        borderRadius: 10,
        border: "1px solid #e3e9f5",
    },
    cardSmall: {
        background: "#f8faff",
        padding: 12,
        borderRadius: 10,
        border: "1px solid #e3e9f5",
        flex: 1,
    },
    label: {
        fontWeight: "600",
        marginBottom: 6,
        display: "block",
        color: "#333",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 6,
        border: "1px solid #ccd4e0",
        fontSize: 15,
    },
    textarea: {
        width: "100%",
        height: 70,
        padding: "10px 12px",
        borderRadius: 6,
        border: "1px solid #ccd4e0",
        fontSize: 15,
        resize: "none",
    },
    helper: {
        marginTop: 5,
        fontSize: 13,
        color: "#666",
    },
    row: {
        display: "flex",
        gap: 15,
    },
    button: {
        background: "#d63384",
        color: "white",
        padding: "12px 18px",
        border: "none",
        borderRadius: 8,
        fontSize: 16,
        fontWeight: "bold",
        cursor: "pointer",
        transition: "0.2s",
    },
};
