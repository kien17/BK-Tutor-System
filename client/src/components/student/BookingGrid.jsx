import React from 'react';

const PERIODS = Array.from({ length: 17 }, (_, i) => i + 1);
const DAYS = [2, 3, 4, 5, 6, 7, 8];

const BookingGrid = ({
  tutors,
  selectedTutor,
  setSelectedTutor,
  week,
  setWeek,
  getSlotStatus,
  handleSlotClick
}) => {
  return (
    <>
      {/* Top Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm min-h-[300px]">
        <div className="flex flex-wrap gap-5 items-center mb-6 p-4 bg-blue-50 rounded-xl shadow-sm">

          {/* Tutor Select */}
          <div className="flex items-center gap-2">
            <label className="font-semibold">Chọn Giảng Viên:</label>
            <select
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn --</option>
              {tutors.map((t) => (
                <option key={t.UserID} value={t.UserID}>
                  {t.FullName || t.Username}
                </option>
              ))}
            </select>
          </div>

          {/* Week Select */}
          <div className="flex items-center gap-2">
            <label className="font-semibold">Tuần:</label>
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(20)].map((_, i) => (
                <option key={i} value={i + 1}>
                  Tuần {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs ml-auto flex-wrap items-center">
            <LegendItem color="bg-green-500" label="Rảnh" />
            <LegendItem color="bg-yellow-400" label="Đã có lịch" />
            <LegendItem color="bg-purple-600" label="Chờ" />
            <LegendItem color="bg-blue-500" label="Đã duyệt" />
            <LegendItem color="bg-indigo-600" label="Tư vấn nhóm" />
          </div>
        </div>

        {/* Schedule Table */}
        {selectedTutor ? (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="w-full table-fixed border-separate border-spacing-0 text-center overflow-hidden">
              <thead>
                <tr>
                  <th className="bg-[#004aad] text-white p-3 w-16 text-sm border border-gray-300">
                    Tiết
                  </th>
                  {DAYS.map((d) => (
                    <th
                      key={d}
                      className="bg-[#0066d1] text-white p-3 text-sm border border-gray-300 text-center"
                    >
                      {d === 8 ? 'Chủ Nhật' : `Thứ ${d}`}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p} className="hover:bg-gray-50">
                    <td className="bg-gray-100 font-semibold border border-gray-300 p-2 text-sm">
                      Tiết {p}
                    </td>

                    {DAYS.map((d) => {
                      const { status, label, color, cursor, data } =
                        getSlotStatus(d, p);

                      return (
                        <td
                          key={`${d}-${p}`}
                          onClick={() => handleSlotClick(d, p, status, data)}
                          className="h-12 text-xs p-1 font-bold border border-gray-300 transition duration-150 align-middle"
                          style={{
                            background: color,
                            cursor,
                            color: status === 'closed' ? '#222' : '#fff'
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.filter = 'brightness(0.95)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.filter = 'none')
                          }
                        >
                          <div className="leading-tight break-words">
                            {status === 'session' && data ? (
                              <>
                                <div>Tư vấn nhóm</div>
                                <div className="text-[11px] font-normal">
                                  {data.CurrentStudents} / {data.MaxStudents}
                                </div>
                              </>
                            ) : (
                              label && <div>{label}</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center mt-12 text-gray-400 italic">
            Vui lòng chọn một Giảng viên để xem lịch rảnh.
          </p>
        )}
      </div>
    </>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1">
    <span className={`w-3 h-3 rounded-sm ${color}`} />
    <span>{label}</span>
  </div>
);

export default BookingGrid;
