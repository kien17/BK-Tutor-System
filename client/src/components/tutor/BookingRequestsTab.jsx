import React, { useState } from "react";
import BookingModal from "../BookingModal";

// =================== STATUS BADGE ===================
const statusBadge = (status) => {
    const map = {
        pending: { text: "Chờ duyệt", color: "purple" },
        confirmed: { text: "Đã duyệt", color: "green" },
        rescheduled: { text: "Đã đổi lịch", color: "orange" },
        rejected: { text: "Từ chối", color: "red" }
    };
    const item = map[status] || { text: status, color: "gray" };

    const colorMap = {
        green: "bg-green-100 text-green-700",
        red: "bg-red-100 text-red-700",
        orange: "bg-orange-100 text-orange-700",
        purple: "bg-purple-100 text-purple-700",
        gray: "bg-gray-100 text-gray-700"
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorMap[item.color]}`}>
            {item.text}
        </span>
    );
};

// =================== BUTTON COMPONENT ===================
const ActionButton = ({ color, children, onClick }) => {
    const baseColors = {
        green: "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200",
        orange: "bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200",
        red: "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200",
        gray: "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
    };

    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded-lg font-semibold text-sm transition ${baseColors[color]}`}
        >
            {children}
        </button>
    );
};

// =================== MAIN COMPONENT ===================
const BookingRequestsTab = ({ bookings, onHandleAction }) => {
    const [selectedBooking, setSelectedBooking] = useState(null);

    const openModal = (booking) => setSelectedBooking(booking);
    const closeModal = () => setSelectedBooking(null);

    const pendingCount = bookings.filter(b => b.Status === "pending").length;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#004aad]">Yêu Cầu Đặt Lịch</h3>
                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                    Chờ duyệt: {pendingCount}
                </span>
            </div>

            {/* Table */}
            {bookings.length === 0 ? (
                <div className="text-center text-gray-500 py-8 italic text-sm">
                    Không có yêu cầu nào trong tuần này.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse">
                        <thead>
                            <tr className="bg-[#004aad] text-white text-sm">
                                <th className="p-3 text-center">Sinh viên</th>
                                <th className="p-3 text-center">Lịch hẹn</th>
                                <th className="p-3 text-center">Nội dung</th>
                                <th className="p-3 text-center">Trạng thái</th>
                                <th className="p-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b, i) => (
                                <tr key={b.BookingID} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                                    <td className="p-3 font-semibold text-[#004aad] text-center">{b.StudentName}</td>
                                    <td className="p-3 text-sm text-center">
                                        Tuần {b.WeekNumber} • Thứ {b.DayOfWeek} • Tiết {b.StartPeriod}{b.EndPeriod !== b.StartPeriod ? `-${b.EndPeriod}` : ""}
                                    </td>
                                    <td className="p-3 max-w-[250px]">
                                        <div className="flex flex-col gap-1">
                                            <span className="truncate block text-sm" title={b.Topic}>
                                                {b.Topic}
                                            </span>
                                            <button
                                                className="text-blue-600 underline text-sm font-semibold hover:text-blue-800 w-max"
                                                onClick={() => openModal(b)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">{statusBadge(b.Status)}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {b.Status === "pending" && (
                                                <>
                                                    <ActionButton color="green" onClick={() => onHandleAction(b.BookingID, "confirmed")}>Duyệt</ActionButton>
                                                    <ActionButton color="orange" onClick={() => onHandleAction(b.BookingID, "rescheduled")}>Đổi lịch</ActionButton>
                                                    <ActionButton color="red" onClick={() => onHandleAction(b.BookingID, "rejected")}>Từ chối</ActionButton>
                                                </>
                                            )}
                                            {b.Status === "confirmed" && (
                                                <ActionButton color="red" onClick={() => onHandleAction(b.BookingID, "rejected")}>Hủy</ActionButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {selectedBooking && (
                <BookingModal
                    isOpen={!!selectedBooking}
                    onClose={closeModal}
                    title="Chi tiết yêu cầu"
                    actions={
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <ActionButton color="gray" onClick={closeModal}>Đóng</ActionButton>
                            {selectedBooking.Status === "pending" && (
                                <>
                                    <ActionButton color="green" onClick={() => { onHandleAction(selectedBooking.BookingID, "confirmed"); closeModal(); }}>Duyệt</ActionButton>
                                    <ActionButton color="orange" onClick={() => { onHandleAction(selectedBooking.BookingID, "rescheduled"); closeModal(); }}>Đổi lịch</ActionButton>
                                    <ActionButton color="red" onClick={() => { onHandleAction(selectedBooking.BookingID, "rejected"); closeModal(); }}>Từ chối</ActionButton>
                                </>
                            )}
                            {selectedBooking.Status === "confirmed" && (
                                <ActionButton color="red" onClick={() => { onHandleAction(selectedBooking.BookingID, "rejected"); closeModal(); }}>Hủy</ActionButton>
                            )}
                        </div>
                    }
                >
                    <div className="flex flex-col gap-4 font-sans text-gray-700">
                        <div className="text-base font-semibold"><span className="font-bold">Sinh viên:</span> {selectedBooking.StudentName}</div>
                        <div className="text-base"><span className="font-semibold">Thời gian:</span> Tuần {selectedBooking.WeekNumber} • Thứ {selectedBooking.DayOfWeek} • Tiết {selectedBooking.StartPeriod}{selectedBooking.EndPeriod !== selectedBooking.StartPeriod ? `-${selectedBooking.EndPeriod}` : ""}</div>
                        <div className="text-base"><span className="font-semibold">Trạng thái:</span> {statusBadge(selectedBooking.Status)}</div>
                        <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto break-words text-sm leading-relaxed">
                            <span className="font-semibold text-gray-800">Nội dung đầy đủ:</span>
                            <div className="mt-1">{selectedBooking.Topic}</div>
                        </div>
                    </div>
                </BookingModal>
            )}
        </div>
    );
};

export default BookingRequestsTab;
