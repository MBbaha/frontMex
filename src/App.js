import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Xonalar from './xonalar';
import axios from 'axios';

function Home() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [stats, setStats] = useState(null);
  const [showOrgRoomsModal, setShowOrgRoomsModal] = useState(false);
const [orgCheckIn, setOrgCheckIn] = useState('');
const [orgCheckOut, setOrgCheckOut] = useState('');
const [orgRoomsData, setOrgRoomsData] = useState([]);


  const fetchOrgRooms = async () => {
  if (!orgCheckIn || !orgCheckOut) {
    alert("Kirish va chiqish sanalarini kiriting");
    return;
  }
  try {
    const res = await axios.get(`https://mexback.onrender.com/api/rooms/getBookedRooms`, {
      params: {
        checkIn: new Date(orgCheckIn).toISOString().split('T')[0],
        checkOut: new Date(orgCheckOut).toISOString().split('T')[0]
      }
    });

    // 🔹 Tashkilot bo‘yicha guruhlash
    const grouped = {};
    res.data.forEach(room => {
      room.guests.forEach(guest => {
        if (guest.companyName) {
          if (!grouped[guest.companyName]) grouped[guest.companyName] = [];
          grouped[guest.companyName].push(room.number);
        }
      });
    });

    // Objectdan massiv shakliga o‘tkazamiz
    const result = Object.entries(grouped).map(([company, rooms]) => ({
      company,
      rooms: [...new Set(rooms)] // takrorlanmas xonalar
    }));

    setOrgRoomsData(result);
  } catch (err) {
    console.error(err);
    alert("Xatolik yuz berdi");
  }
};

  
  // 📌 Bo‘sh joylarni tekshirish
  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      alert('Iltimos, kirish va chiqish sanalarini tanlang.');
      return;
    }
    try {
      const res = await axios.get(
        `https://mexback.onrender.com/api/rooms/availableStat`,
        {
          params: {
            checkIn: new Date(checkIn).toISOString().split('T')[0],
            checkOut: new Date(checkOut).toISOString().split('T')[0]
          }
        }
      );
      console.log("API javobi:", res.data);
      setStats(res.data);
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi. Server bilan bog‘lanib bo‘lmadi.");
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">📋 Mijozlar Boshqaruvi</h1>
      <div className="button-group">
        <button className="home-btn" onClick={() => navigate('/xonalar')}>
          ➕ Yangi mijoz qo‘shish
        </button>
        <button className="home-btn" onClick={() => navigate('/xonalar')}>
          🍽️ Ovqatlar haqida ma'lumot
        </button>
      </div>

      {/* 📅 Sana oralig‘i formasi */}
      <div className="statistic-form">
        <h2>📊 Bo‘sh joylar statistikasi</h2>
        <div className="form-row">
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
          <span>⟶</span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          <button onClick={handleCheckAvailability}>Hisoblash</button>
        </div>
      </div>

      {/* 📊 Natijalar */}
      {stats && (
        <div className="statistic-float-box">
          <h3>📊 Natijalar</h3>
          <p><strong>Bo‘sh xonalar soni:</strong> {stats.availableRooms}</p>
          <p><strong>Bo‘sh joylar soni:</strong> {stats.availableCapacity}</p>
          <p><strong>Umumiy sig‘im:</strong> 209</p>
          <p><strong>Bandlik foizi:</strong> {stats.occupancyRate}%</p>

          <h4>📃 Bo‘sh xonalar ro‘yxati:</h4>
          <ul>
            {(stats.details || []).map((room, idx) => (
              <li key={idx}>
                🛏 Xona: {room.number} — {room.free} joy bo‘sh
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/xonalar" element={<Xonalar />} />
      </Routes>
    </Router>
  );
}

export default App;
