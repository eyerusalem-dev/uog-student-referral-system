import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="center-screen">
      <div className="simple-card">
        <h1>Unauthorized</h1>
        <p>You do not have permission to access this page.</p>
        <Link to="/">Go back to dashboard</Link>
      </div>
    </div>
  );
};

export default Unauthorized;