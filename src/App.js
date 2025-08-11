import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './xonalar.css';

function RoomDashboard() {
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    guestsCount: '',
    checkIn: '',
    checkOut: '',
    companyName: '',
    phoneNumber: '',
  });
  const [message, setMessage] = useState('');
  const [selectedRoomGuests, setSelectedRoomGuests] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [showOrgRoomsModal, setShowOrgRoomsModal] = useState(false);
  const [orgCheckIn, setOrgCheckIn] = useState('');
  const [orgCheckOut, setOrgCheckOut] = useState('');
  const [orgRoomsData, setOrgRoomsData] = useState([]);

  const [showAvailableRoomsModal, setShowAvailableRoomsModal] = useState(false);
const [availCheckIn, setAvailCheckIn] = useState('');
const [availCheckOut, setAvailCheckOut] = useState('');
const [availableRoomsData, setAvailableRoomsData] = useState([]);


    const fetchAvailableRooms = async () => {
    if (!availCheckIn || !availCheckOut) {
      alert('Kirish va chiqish sanalarini kiriting');
      return;
    }

    try {
      const res = await axios.get(
        'https://mexback.onrender.com/api/rooms/getFreeRoom',
        {
          checkIn: availCheckIn,
          checkOut: availCheckOut
        }
      );

      console.log('📥 Bo‘sh xonalar:', res.data);

      const roomsArray = Array.isArray(res.data.details) ? res.data.details : [];

      // Xonalarni raqam bo‘yicha tartiblash
      const sorted = roomsArray.sort((a, b) => {
        const numA = parseInt(a.number.replace(/\D/g, ''), 10);
        const numB = parseInt(b.number.replace(/\D/g, ''), 10);
        return numA - numB;
      });

      setAvailableRoomsData(sorted);

      if (!sorted.length) {
        alert('Berilgan sanalarda bo‘sh xona topilmadi.');
      }
    } catch (err) {
      console.error('❌ API xatosi:', err);
      alert('Xatolik: ' + err.message);
    }
  };

  // 🔹 Tashkilot bo‘yicha xonalarni olish
const fetchOrgRooms = async () => {
  if (!orgCheckIn || !orgCheckOut) {
    alert('Kirish va chiqish sanalarini kiriting');
    return;
  }

  try {
    const params = {
      checkIn: new Date(orgCheckIn).toISOString().split('T')[0],
      checkOut: new Date(orgCheckOut).toISOString().split('T')[0],
    };

    console.log('📤 Yuborilayotgan params:', params);

    const res = await axios.get(
      'https://mexback.onrender.com/api/rooms/booked',
      { params, timeout: 10000 }
    );

    console.log('📥 Backend javobi:', res.data);

    const roomsArray = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data.rooms)
      ? res.data.rooms
      : Array.isArray(res.data.availableRoomsList)
      ? res.data.availableRoomsList
      : [];

    if (!roomsArray.length) {
      setOrgRoomsData([]);
      alert('Berilgan sanalarda bronlangan xona topilmadi.');
      return;
    }

    // Kompaniya bo‘yicha guruhlash + xona raqamlarini tartiblash
    const grouped = {};
    roomsArray.forEach((room) => {
      const guests = Array.isArray(room.guests) ? room.guests : [];
      guests.forEach((guest) => {
        const company =
          guest.companyName ||
          guest.company ||
          guest.organization ||
          guest.org;
        if (company) {
          if (!grouped[company]) grouped[company] = [];
          grouped[company].push(room.number ?? room.name ?? 'unknown');
        }
      });
    });

    const result = Object.entries(grouped).map(([company, rooms]) => ({
      company,
      rooms: [...new Set(rooms)].sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10);
        const numB = parseInt(b.replace(/\D/g, ''), 10);
        return numA - numB;
      }),
    }));

    setOrgRoomsData(result);
  } catch (err) {
    console.error('❌ API xatosi:', err);
    alert('Xatolik: ' + err.message);
  }
};


  // 🔹 Xonalarni olish
  const fetchRooms = async () => {
    try {
      const response = await axios.get(
        'https://mexback.onrender.com/api/rooms/getRoom'
      );

      const sortedRooms = response.data.sort((a, b) => {
        const numA = parseInt(a.number.replace(/\D/g, ''), 10);
        const numB = parseInt(b.number.replace(/\D/g, ''), 10);
        return numA - numB;
      });

      setRooms(sortedRooms);
    } catch (err) {
      console.error('Xatolik xonalarni olishda:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 🔹 Form inputlarini boshqarish
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Bron qilish
  const handleGenerate = async () => {
    const { checkIn, checkOut, guestsCount, companyName, phoneNumber } =
      formData;

    if (
      !checkIn ||
      !checkOut ||
      !guestsCount ||
      !companyName ||
      !phoneNumber ||
      guestsCount <= 0
    ) {
      alert('Iltimos, to‘g‘ri ma’lumotlarni kiriting.');
      return;
    }

    try {
      const res = await axios.post(
        'https://mexback.onrender.com/api/guests/register',
        {
          guestsCount,
          checkIn,
          checkOut,
          companyName,
          phoneNumber,
        }
      );

      setMessage(res.data.message || '✅ Bron qilish muvaffaqiyatli bajarildi.');
      fetchRooms();
      setShowBookingForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Xatolik yuz berdi');
    }
  };

  // 🔹 Bronni bekor qilish
  const handleUnbook = async () => {
    const { checkIn, checkOut, guestsCount, companyName, phoneNumber } =
      formData;

    if (
      !checkIn ||
      !checkOut ||
      !guestsCount ||
      !companyName ||
      !phoneNumber ||
      guestsCount <= 0
    ) {
      alert('Iltimos, to‘g‘ri ma’lumotlarni kiriting.');
      return;
    }

    try {
      const res = await axios.delete(
        'https://mexback.onrender.com/api/guests/deleteByDate',
        {
          data: {
            guestsCount,
            checkIn,
            checkOut,
            companyName,
            phoneNumber,
          },
        }
      );

      setMessage(res.data.message || '✅ Bronlar bekor qilindi.');
      fetchRooms();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '❌ Xatolik yuz berdi');
    }
  };

  // 🔹 Sanalarni generatsiya qilish
  const generateDays = (startDate, numberOfDays) => {
    const result = [];
    const weekdays = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'];
    const date = new Date(startDate);

    for (let i = 0; i < numberOfDays; i++) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const weekday = weekdays[date.getDay()];
      result.push({
        label: `${weekday} ${day}.${month}`,
        date: new Date(date),
      });
      date.setDate(date.getDate() + 1);
    }
    return result;
  };

  const days = generateDays(new Date(), 31);

  // 🔹 Mehmonlar modalini ko‘rsatish
  const toggleGuestDetails = (room) => {
    setSelectedRoomGuests(room);
  };

  return (
    <div className="room-dashboard">
      <h1>📅 Shaxmatka (Xona Bandlik Jadvali)</h1>

      <button onClick={() => setShowBookingForm(true)}>
        ➕ Xona bron qilish
      </button>
      <button onClick={() => setShowOrgRoomsModal(true)}>
        🏢 Xonalar ro‘yxatini olish
      </button>
<button onClick={() => setShowAvailableRoomsModal(true)}>
  🛏 Bo‘sh xonalarni ko‘rish
</button>


{showAvailableRoomsModal && (
  <div className="booking-overlay">
    <div className="booking-form">
      <h2>🛏 Bo‘sh xonalar</h2>
      <input
        type="date"
        value={availCheckIn}
        onChange={(e) => setAvailCheckIn(e.target.value)}
      />
      <input
        type="date"
        value={availCheckOut}
        onChange={(e) => setAvailCheckOut(e.target.value)}
      />
      <button onClick={fetchAvailableRooms}>🔍 Qidirish</button>
      <button
        onClick={() => setShowAvailableRoomsModal(false)}
        style={{ marginLeft: 10 }}
      >
        Yopish
      </button>

      {availableRoomsData.length > 0 && (
        <div style={{ marginTop: '15px', textAlign: 'left' }}>
          {availableRoomsData.map((room, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              🛏 <strong>{room.number}</strong> — {room.free}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}



      {/* 🔹 Tashkilot bo‘yicha xonalar modal */}
      {showOrgRoomsModal && (
        <div className="booking-overlay">
          <div className="booking-form">
            <h2>🏢 Tashkilot bo‘yicha xonalar</h2>
            <input
              type="date"
              value={orgCheckIn}
              onChange={(e) => setOrgCheckIn(e.target.value)}
            />
            <input
              type="date"
              value={orgCheckOut}
              onChange={(e) => setOrgCheckOut(e.target.value)}
            />
            <button onClick={fetchOrgRooms}>🔍 Qidirish</button>
            <button
              onClick={() => setShowOrgRoomsModal(false)}
              style={{ marginLeft: 10 }}
            >
              Yopish
            </button>

            {orgRoomsData.length > 0 && (
              <div style={{ marginTop: '15px', textAlign: 'left' }}>
                {orgRoomsData.map((org, idx) => (
                  <div key={idx} style={{ marginBottom: '10px' }}>
                    <strong>{org.company}</strong>
                    <ul>
                      {org.rooms.map((room, i) => (
                        <li key={i}>🛏 {room}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔹 Xona bron qilish modal */}
      {showBookingForm && (
        <div className="booking-overlay">
          <div className="booking-form">
            <h2>➕ Xonani bron qilish</h2>
            <input
              type="number"
              name="guestsCount"
              placeholder="Mehmonlar soni"
              value={formData.guestsCount}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="companyName"
              placeholder="Tashkilot nomi"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phoneNumber"
              placeholder="Telefon raqami"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleChange}
              required
            />
            <button onClick={handleGenerate}>📌 Bron qilish</button>
            <button onClick={handleUnbook} style={{ marginLeft: 10 }}>
              ❌ Bronni yechish
            </button>
            <button
              onClick={() => setShowBookingForm(false)}
              style={{ marginLeft: 10 }}
            >
              Yopish
            </button>
            {message && <p className="status-msg">{message}</p>}
          </div>
        </div>
      )}

      {/* 🔹 Xonalar jadvali */}
      <div className="table-container">
        <div className="header-row">
          <div className="room-cell">Xona №</div>
          {days.map((day, idx) => (
            <div key={idx} className="day-cell day-header">
              {day.label}
            </div>
          ))}
        </div>

        {rooms.map((room, idx) => (
          <div className="room-row" key={idx}>
            <div
              className="room-cell"
              onClick={() => toggleGuestDetails(room)}
            >
              {room.number}
            </div>
            {days.map((dayObj, i) => {
              const currentDate = new Date(dayObj.date);
              const guestsToday = (room.guests || []).filter((guest) => {
                const from = new Date(guest.from);
                const to = new Date(guest.to);
                return currentDate >= from && currentDate <= to;
              });

              const occupied = guestsToday.length;
              const ratioPercent = (occupied / room.capacity) * 100;

              let colorClass = 'vacant';
              if (ratioPercent === 100) colorClass = 'qizil';
              else if (ratioPercent >= 75) colorClass = 'sabzi';
              else if (ratioPercent >= 50) colorClass = 'sariq';
              else if (ratioPercent >= 25) colorClass = 'kok';

              return (
                <div
                  key={i}
                  className={`day-cell ${colorClass}`}
                  title={
                    occupied > 0
                      ? guestsToday.map((g) => g.name).join(', ')
                      : 'Bo‘sh'
                  }
                >
                  {occupied > 0 && (
                    <div className="guest-count">
                      {occupied}/{room.capacity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 🔹 Xona mehmonlari modal */}
      {selectedRoomGuests && (
        <div
          className="guest-info-modal"
          onClick={() => setSelectedRoomGuests(null)}
        >
          <div
            className="guest-info-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selectedRoomGuests.number} - mehmonlar:</h3>
            {selectedRoomGuests.guests.length === 0 ? (
              <p>Bu xonada mehmon yo‘q.</p>
            ) : (
              <ul>
                {selectedRoomGuests.guests.map((g, i) => (
                  <li key={i}>
                    {g.name} ({g.from} - {g.to}){' '}
                    {g.phoneNumber && `📞 ${g.phoneNumber}`}{' '}
                    {g.companyName && `🏢 ${g.companyName}`}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setSelectedRoomGuests(null)}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomDashboard;

