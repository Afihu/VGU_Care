import React from 'react';
import greens from '../assets/images/Healthy_Greens.jpg';

export default function AppointmentUserView() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column' }}>
      {/* Title Box */}
      <div 
        style={{
          padding: '18px 36px',
          backgroundColor: '#fcf803', 
          color: 'black',
          fontSize: '20px',
          borderRadius: '15px',
          border: '2px solid #fcf803',
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: '30px',
          width: 'fit-content',
          marginLeft: '50px'
        }}
      >
        MY APPOINTMENTS
      </div>

      {/* Status boxes and image side by side */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        
        {/* Status boxes */}
        <div style={{ display: 'flex', gap: '100px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '18px 28px',
              backgroundColor: '#03befc',
              color: 'black',
              fontSize: '12px',
              borderRadius: '15px',
              border: '2px solid #03befc',
              textAlign: 'center',
              display: 'inline-block',
              marginLeft: '50px'
            }}
          >
            ALL
          </button>

          <button
            type="button"
            style={{
              padding: '18px 28px',
              backgroundColor: '#b4fac1',
              color: 'black',
              fontSize: '12px',
              borderRadius: '15px',
              border: '2px solid #b4fac1',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            APPROVED
          </button>

          <button
            type="button"
            style={{
              padding: '18px 28px',
              backgroundColor: '#bdbfbe',
              color: 'black',
              fontSize: '12px',
              borderRadius: '15px',
              border: '2px solid #bdbfbe',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            PENDING
          </button>

          <button
            type="button"
            style={{
              padding: '18px 28px',
              backgroundColor: '#fc9a9a',
              color: 'black',
              fontSize: '12px',
              borderRadius: '15px',
              border: '2px solid #fc9a9a',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            REJECTED
          </button>
        </div>

        {/* Image on the right */}
        <img
          src={greens}
          alt="Graveyard"
          style={{
            width: '360px',
            height: '500px',
            objectFit: 'cover',
            marginLeft: '250px'
          }}
        />
      </div>
    </div>
  );
}
