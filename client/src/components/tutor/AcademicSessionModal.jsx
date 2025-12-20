import BookingModal from "../BookingModal";

const AcademicSessionModal = ({ isOpen, onClose, session }) => {
    if (!session) return null;

    return (
        <BookingModal
            isOpen={isOpen}
            onClose={onClose}
            title="Chi tiết Buổi Tư Vấn Nhóm"
        >
            <div className="flex flex-col gap-4">

                <div className="text-gray-700 break-words whitespace-normal">
                    <span className="font-semibold">Chủ đề:</span>{" "}
                    {session.Topic}
                </div>

                <div className="text-gray-700 break-words whitespace-normal">
                    <span className="font-semibold">Thời gian:</span>{" "}
                    Tuần {session.WeekNumber} • Thứ {session.DayOfWeek} • Tiết {session.StartPeriod}
                </div>

                <div className="text-gray-700 break-words whitespace-normal">
                    <span className="font-semibold">Hình thức:</span>{" "}
                    {session.MeetingMode}
                </div>

                <div className="text-gray-700 break-words whitespace-normal">
                    <span className="font-semibold">Địa điểm / Link:</span>{" "}
                    {session.Location || "Chưa cập nhật"}
                </div>

                <div className="text-gray-700 break-words whitespace-normal">
                    <span className="font-semibold">Số sinh viên:</span>{" "}
                    {session.CurrentStudents} / {session.MaxStudents}
                </div>

            </div>
        </BookingModal>
    );
};

export default AcademicSessionModal;
