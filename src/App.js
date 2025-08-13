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
  const [visibleCount, setVisibleCount] = useState(10);

  const [showAvailableRoomsModal, setShowAvailableRoomsModal] = useState(false);
  const [availCheckIn, setAvailCheckIn] = useState('');
  const [availCheckOut, setAvailCheckOut] = useState('');
  const [availableRoomsData, setAvailableRoomsData] = useState([]);

  const sortRoomsByNumber = (roomsArray) =>
    [...roomsArray].sort((a, b) => {
      const numA = parseInt(a.number?.replace(/\D/g, '') || 0, 10);
      const numB = parseInt(b.number?.replace(/\D/g, '') || 0, 10);
      return numA - numB;
    });

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('https://mexback.onrender.com/api/rooms/getRoom');
      setRooms(sortRoomsByNumber(data));
    } catch (err) {
      console.error('❌ Xonalarni olishda xato:', err);
      alert('Xonalarni yuklashda xatolik');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    if (!availCheckIn || !availCheckOut) return alert('Kirish va chiqish sanalarini kiriting');

    try {
      const { data } = await axios.get(
        'https://mexback.onrender.com/api/rooms/freeRoom',
        { params: { checkIn: availCheckIn, checkOut: availCheckOut } }
      );
      const sorted = sortRoomsByNumber(Array.isArray(data.details) ? data.details : []);
      setAvailableRoomsData(sorted);
      if (!sorted.length) alert('Bo‘sh xona topilmadi');
    } catch (err) {
      console.error(err);
      alert('Bo‘sh xonalarni yuklashda xatolik');
    }
  };

  const fetchOrgRooms = async () => {
    if (!orgCheckIn || !orgCheckOut) return alert('Kirish va chiqish sanalarini kiriting');

    try {
      const params = {
        checkIn: new Date(orgCheckIn).toISOString().split('T')[0],
        checkOut: new Date(orgCheckOut).toISOString().split('T')[0],
      };
      const { data } = await axios.get('https://mexback.onrender.com/api/rooms/booked', { params });

      const roomsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.rooms)
        ? data.rooms
        : Array.isArray(data.availableRoomsList)
        ? data.availableRoomsList
        : [];

      if (!roomsArray.length) {
        setOrgRoomsData([]);
        return alert('Berilgan sanalarda bronlangan xona topilmadi');
      }

      const grouped = {};
      roomsArray.forEach((room) => {
        (room.guests || []).forEach((guest) => {
          const company = guest.companyName || guest.company || guest.organization || guest.org;
          if (company) {
            if (!grouped[company]) grouped[company] = [];
            grouped[company].push(room.number || 'unknown');
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
      console.error(err);
      alert('Tashkilot xonalarini yuklashda xatolik');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    const { checkIn, checkOut, guestsCount, companyName, phoneNumber } = formData;
    if (!checkIn || !checkOut || !guestsCount || !companyName || !phoneNumber) {
      return alert('Iltimos, barcha maydonlarni to‘ldiring');
    }

    try {
      const { data } = await axios.post(
        'https://mexback.onrender.com/api/guests/register',
        formData
      );
      setMessage(data.message || '✅ Bron qilindi');
      fetchRooms();
      setShowBookingForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Bron qilishda xatolik');
    }
  };

  const handleUnbook = async () => {
    try {
      const { data } = await axios.delete(
        'https://mexback.onrender.com/api/guests/deleteByDate',
        { data: formData }
      );
      setMessage(data.message || '✅ Bron bekor qilindi');
      fetchRooms();
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Bronni yechishda xatolik');
    }
  };

  const generateDays = (startDate, numberOfDays) => {
    const weekdays = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'];
    return Array.from({ length: numberOfDays }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        label: `${weekdays[date.getDay()]} ${date.getDate().toString().padStart(2, '0')}.${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}`,
        date,
      };
    });
  };

  const days = generateDays(new Date(), 31);

  return (
    <div className="room-dashboard">
      {/* header */}
      <h1>📅 Shaxmatka</h1>
      <div className="actions">
        <button onClick={() => setShowBookingForm(true)}>➕ Bron qilish</button>
        <button onClick={() => setShowOrgRoomsModal(true)}>🏢 Tashkilot xonalari</button>
        <button onClick={() => setShowAvailableRoomsModal(true)}>🛏 Bo‘sh xonalar</button>
      </div>

      {/* jadval */}
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
            <div className="room-cell" onClick={() => setSelectedRoomGuests(room)}>
              {room.number}
            </div>
            {days.map((dayObj, i) => {
              const currentDate = dayObj.date;
              const guestsToday = (room.guests || []).filter(
                (g) => currentDate >= new Date(g.from) && currentDate <= new Date(g.to)
              );
              const ratioPercent = (guestsToday.length / room.capacity) * 100;
              let colorClass = 'vacant';
              if (ratioPercent === 100) colorClass = 'qizil';
              else if (ratioPercent >= 75) colorClass = 'sabzi';
              else if (ratioPercent >= 50) colorClass = 'sariq';
              else if (ratioPercent >= 25) colorClass = 'kok';

              return (
                <div
                  key={i}
                  className={`day-cell ${colorClass}`}
                  title={guestsToday.length ? guestsToday.map((g) => g.name).join(', ') : 'Bo‘sh'}
                >
                  {guestsToday.length > 0 && (
                    <div className="guest-count">
                      {guestsToday.length}/{room.capacity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomDashboard;
