import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Xonalar from "./xonalar";
import axios from "axios";

function Home() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [stats, setStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [prevStats, setPrevStats] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const handleCloseStats = () => setStats(null);
  const handleCloseSearch = () => setSearchResults([]);

  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      alert("Iltimos, sana oralig‘ini tanlang.");
      return;
    }
    try {
      const res = await axios.post("https://mexback.onrender.com/api/rooms/getRoomAvailability ", {
        checkIn,
        checkOut,
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi");
    }
  };

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const fetchMonthlyStats = async () => {
      try {
        const current = await axios.get(
          `https://mexback.onrender.com/api/rooms/monthly-stats?year=${year}&month=${month}`
        );
        setMonthlyStats(current.data);

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const previous = await axios.get(
          `https://mexback.onrender.com/api/rooms/monthly-stats?year=${prevYear}&month=${prevMonth}`
        );
        setPrevStats(previous.data);
      } catch (err) {
        console.error("Monthly stats error:", err);
      }
    };

    fetchMonthlyStats();
  }, []);

  const diffRate =
    monthlyStats && prevStats
      ? (monthlyStats.occupancyRate - prevStats.occupancyRate).toFixed(1)
      : null;

  return (
    <div className="home-container">
      <h1 className="home-title">📋 Mijozlar Boshqaruvi</h1>

      <div className="button-group">
        <button className="home-btn" onClick={() => navigate("/xonalar")}>
          ➕ Yangi mijoz qo‘shish
        </button>
        <button className="home-btn" onClick={() => navigate("/xonalar")}>
          🍽️ Ovqatlar haqida ma'lumot
        </button>
      </div>

      {/* 📅 Statistika formasi */}
      <div className="statistic-form">
        <h2>📊 Bo‘sh joylar statistikasi</h2>
        <div className="form-row">
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <span>⟶</span>
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          <button onClick={handleCheckAvailability}>Hisoblash</button>
        </div>
      </div>

      {/* 📊 Statistikani ko‘rsatish */}
      {stats && (
        <div className="statistic-float-box">
          <h3>📊 Statistika</h3>
          <button className="close-btn" onClick={handleCloseStats}>
            ✖ Yopish
          </button>
          <p><strong>Bo‘sh xonalar:</strong> {stats.availableRooms}</p>
          <p><strong>Bo‘sh joylar:</strong> {stats.availableCapacity}</p>
          <p><strong>Umumiy sig‘im:</strong> 209</p>
          <p><strong>Bandlik foizi:</strong> {stats.occupancyRate}%</p>

          <h4>📃 Bo‘sh xonalar ro‘yxati:</h4>
          <ul>
            {stats.details.map((room, idx) => (
              <li key={idx}>🛏 {room.number}: {room.free} joy bo‘sh</li>
            ))}
          </ul>
        </div>
      )}

      {/* 🔍 Qidiruv natijalari */}
      {searchResults.length > 0 && (
        <div className="search-result-box">
          <h3>🔍 Qidiruv natijalari</h3>
          <button className="close-btn" onClick={handleCloseSearch}>✖ Yopish</button>
          <ul>
            {searchResults.map((room, idx) => (
              <li key={idx}>
                🛏 Xona raqami: <strong>{room.number}</strong> <br />
                Sig‘imi: {room.capacity}
                <ul>
                  {room.guests.map((g, i) => (
                    <li key={i}>
                      👤 {g.name}, 📞 {g.phoneNumber}, 🏢 {g.companyName},
                      🗓 {new Date(g.from).toLocaleDateString()} - {new Date(g.to).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🗓 Oylik Statistika */}
      {monthlyStats && (
        <div className="monthly-stat-box">
          <h3>📆 {monthlyStats.month}-oy statistikasi</h3>
          <p><strong>Jami xonalar:</strong> {monthlyStats.totalRooms}</p>
          <p><strong>Jami sig‘im:</strong> 209</p>
          <p><strong>Band joylar:</strong> {monthlyStats.usedCount}</p>
          <p><strong>Bandlik foizi:</strong> {monthlyStats.occupancyRate}%</p>
          {diffRate !== null && (
            <p>
              📉 Oldingi oydan farq:{" "}
              <strong style={{ color: diffRate >= 0 ? "green" : "red" }}>
                {diffRate > 0 ? "+" : ""}
                {diffRate}%
              </strong>
            </p>
          )}
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
