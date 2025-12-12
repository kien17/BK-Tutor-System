// src/components/student/BookingGrid.jsx
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
      <div
        style={{
          display: 'flex',
          gap: 20,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#f8faff',
          padding: 12,
          borderRadius: 8,
          boxShadow: "0 3px 10px rgba(0,0,0,0.05)"
        }}
      >
        {/* Tutor Select */}
        <div>
          <label style={{ fontWeight: 600, marginRight: 10 }}>Chọn Giảng Viên:</label>
          <select
            value={selectedTutor}
            onChange={(e) => setSelectedTutor(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 6,
              minWidth: 200,
              border: "1px solid #ccc",
              background: "white"
            }}
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
        <div>
          <label style={{ fontWeight: 600, marginRight: 10 }}>Tuần:</label>
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "white"
            }}
          >
            {[...Array(20)].map((_, i) => (
              <option key={i} value={i + 1}>Tuần {i + 1}</option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, fontSize: 13, marginLeft: 'auto' }}>
          <span style={{ background: '#28a745', width: 15, height: 15, borderRadius: 3 }}></span> Rảnh
          <span style={{ background: '#ffc107', width: 15, height: 15, borderRadius: 3 }}></span> Đầy
          <span style={{ background: '#6f42c1', width: 15, height: 15, borderRadius: 3 }}></span> Chờ
          <span style={{ background: '#007bff', width: 15, height: 15, borderRadius: 3 }}></span> Duyệt
        </div>
      </div>

      {/* Schedule Table */}
      {selectedTutor ? (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              borderCollapse: 'separate',
              borderSpacing: 0,
              width: '100%',
              textAlign: 'center',
              tableLayout: 'fixed',
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 3px 12px rgba(0,0,0,0.08)"
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    background: '#004aad',
                    color: 'white',
                    padding: 10,
                    width: 80,
                    fontSize: 14
                  }}
                >
                  Tiết
                </th>

                {DAYS.map((d) => (
                  <th
                    key={d}
                    style={{
                      background: '#0066d1',
                      color: 'white',
                      padding: 10,
                      fontSize: 14
                    }}
                  >
                    Thứ {d}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td
                    style={{
                      background: '#f2f2f2',
                      padding: 8,
                      fontWeight: 600,
                      borderRight: "1px solid #dcdcdc"
                    }}
                  >
                    Tiết {p}
                  </td>

                  {DAYS.map((d) => {
                    const { status, label, color, cursor, data } = getSlotStatus(d, p);

                    return (
                      <td
                        key={`${d}-${p}`}
                        style={{
                          height: 48,
                          fontSize: 12,
                          border: "1px solid #e3e3e3",
                          background: color,
                          cursor,
                          color: status === 'closed' ? '#222' : 'white',
                          fontWeight: 'bold',
                          transition: "0.15s",
                          width: 80
                        }}
                        onClick={() => handleSlotClick(d, p, status, data)}
                        onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.93)"}
                        onMouseLeave={e => e.currentTarget.style.filter = "none"}
                      >
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p
          style={{
            textAlign: 'center',
            marginTop: 50,
            color: '#888',
            fontStyle: 'italic'
          }}
        >
          Vui lòng chọn một Giảng viên để xem lịch rảnh.
        </p>
      )}
    </>
  );
};

export default BookingGrid;
