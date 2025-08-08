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

  useEffect(() => {
    fetchRooms();
 
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('https://mexback.onrender.com/api/rooms/getRoom');
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    const { checkIn, checkOut, guestsCount, companyName, phoneNumber } = formData;

    if (!checkIn || !checkOut || !guestsCount || !companyName || !phoneNumber || guestsCount <= 0) {
      alert('Iltimos, to‘g‘ri ma’lumotlarni kiriting.');
      return;
    }

    try {
      const res = await axios.post('https://mexback.onrender.com/api/guests/register', {
        guestsCount,
        checkIn,
        checkOut,
        companyName,
        phoneNumber,
      });
      setMessage(res.data.message || '✅ Bron qilish muvaffaqiyatli bajarildi.');
      fetchRooms();
      setShowBookingForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Xatolik yuz berdi');
    }
  };

  const handleUnbook = async () => {
    const { checkIn, checkOut, guestsCount, companyName, phoneNumber } = formData;

    if (!checkIn || !checkOut || !guestsCount || !companyName || !phoneNumber || guestsCount <= 0) {
      alert('Iltimos, to‘g‘ri ma’lumotlarni kiriting.');
      return;
    }

    try {
      const res = await axios.delete('https://mexback.onrender.com/api/guests/deleteByDate', {
        data: { guestsCount, checkIn, checkOut, companyName, phoneNumber },
      });
      setMessage(res.data.message || '✅ Bronlar bekor qilindi.');
      fetchRooms();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '❌ Xatolik yuz berdi');
    }
  };

  const generateDays = (startDate, numberOfDays) => {
    const result = [];
    const weekdays = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'];
    const date = new Date(startDate);
    for (let i = 0; i < numberOfDays; i++) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const weekday = weekdays[date.getDay()];
      result.push({ label: `${weekday} ${day}.${month}`, date: new Date(date) });
      date.setDate(date.getDate() + 1);
    }
    return result;
  };

  const days = generateDays(new Date(), 31);

  const toggleGuestDetails = room => {
    setSelectedRoomGuests(room);
  };

  return (
    <div className="room-dashboard">
      <h1>📅 Shaxmatka (Xona Bandlik Jadvali)</h1>
      <button onClick={() => setShowBookingForm(true)}>➕ Xona bron qilish</button>

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
            <button onClick={handleUnbook} style={{ marginLeft: 10 }}>❌ Bronni yechish</button>
            <button onClick={() => setShowBookingForm(false)} style={{ marginLeft: 10 }}>Yopish</button>
            {message && <p className="status-msg">{message}</p>}
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="header-row">
          <div className="room-cell">Xona №</div>
          {days.map((day, idx) => (
            <div key={idx} className="day-cell day-header">{day.label}</div>
          ))}
        </div>

        {rooms.map((room, idx) => (
          <div className="room-row" key={idx}>
            <div className="room-cell" onClick={() => toggleGuestDetails(room)}>{room.number}</div>
            {days.map((dayObj, i) => {
              const currentDate = new Date(dayObj.date);
              const guestsToday = room.guests.filter(guest => {
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
                  title={occupied > 0 ? guestsToday.map(g => g.name).join(', ') : 'Bo‘sh'}
                >
                  {occupied > 0 && (
                    <div className="guest-count">{occupied}/{room.capacity}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedRoomGuests && (
        <div className="guest-info-modal" onClick={() => setSelectedRoomGuests(null)}>
          <div className="guest-info-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedRoomGuests.number} - mehmonlar:</h3>
            {selectedRoomGuests.guests.length === 0 ? (
              <p>Bu xonada mehmon yo‘q.</p>
            ) : (
              <ul>
                {selectedRoomGuests.guests.map((g, i) => (
                  <li key={i}>
                    {g.name} ({g.from} - {g.to}) {g.phoneNumber ? `📞 ${g.phoneNumber}` : ''} {g.companyName ? `🏢 ${g.companyName}` : ''}
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


