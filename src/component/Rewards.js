import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Rewards({ token, user }) {
  const [programs, setPrograms] = useState([]);
  const [myReward, setMyReward] = useState(null);
  const [points, setPoints] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [message, setMessage] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const isRenter = user?.role === 'Renter' || user?.Role === 'Renter';

  const pointsPerDollar = 10;

  useEffect(() => {
    if (isRenter) {
      fetchPrograms();
      fetchMyReward();
      fetchPoints();
    }
  }, [isRenter]);

  const fetchPrograms = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rewards', authHeader);
      setPrograms(res.data);
    } catch (err) {
      console.error('Failed to load programs');
    }
  };

  const fetchMyReward = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rewards/my-reward', authHeader);
      setMyReward(res.data);
    } catch (err) {
      console.error('No reward program joined');
    }
  };

  const fetchPoints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rewards/my-points', authHeader);
      setPoints(res.data.earned || 0);
      setUsedPoints(res.data.used || 0);
    } catch (err) {
      console.error('Failed to load points');
    }
  };

  const handleJoin = async (rewardId) => {
    try {
      await axios.post('http://localhost:5000/api/rewards/join', { reward_id: rewardId }, authHeader);
      setMessage('Joined successfully!');
      fetchMyReward();
      fetchPoints();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to join');
    }
  };

  const availablePoints = points - usedPoints;

  if (!isRenter) {
    return (
      <div className="container">
        <h2>Rewards</h2>
        <div className="card">
          <p style={{ color: '#666' }}>Rewards are available for renters only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Rewards</h2>
      {message && <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}

      {/* How it works */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px' }}>How It Works</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <p style={{ fontWeight: '600', margin: '0 0 5px' }}>1. Join</p>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Select a rewards program</p>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <p style={{ fontWeight: '600', margin: '0 0 5px' }}>2. Book</p>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Earn points on every booking</p>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <p style={{ fontWeight: '600', margin: '0 0 5px' }}>3. Redeem</p>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Use points when booking ({pointsPerDollar} pts = $1)</p>
          </div>
        </div>
      </div>

      {myReward ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Available Points</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0' }}>{availablePoints}</p>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                Worth ${Math.floor(availablePoints / pointsPerDollar)} in discounts
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Earning</p>
              <p style={{ fontSize: '18px', fontWeight: '600', margin: '5px 0' }}>{myReward.award_points} pts/booking</p>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Total earned: {points} | Used: {usedPoints}</p>
            </div>
          </div>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            Use your points when booking a property to get a discount.
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: '#666', marginBottom: '20px' }}>Join a program to start earning points.</p>
          <div className="property-grid">
            {programs.map(program => (
              <div key={program.rewards_id} className="card">
                <h3 style={{ margin: '0 0 10px' }}>Rewards Program</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px' }}>{program.award_points} pts</p>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 15px' }}>per booking</p>
                <button onClick={() => handleJoin(program.rewards_id)} style={{ width: '100%' }}>Join</button>
              </div>
            ))}
          </div>
          {programs.length === 0 && (
            <div className="card">
              <p style={{ color: '#666' }}>No reward programs available.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Rewards;