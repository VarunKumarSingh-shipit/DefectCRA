import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import './Navbar.css';

const Navbar = ({ onOpenSettings }) => {
  const location = useLocation();
  const { apiKey } = useContext(AppContext);
  
  const path = location.pathname;
  
  const steps = [
    { num: 1, label: 'Upload', active: path === '/' },
    { num: 2, label: 'Dashboard', active: path === '/dashboard' },
    { num: 3, label: '5 Why Analysis', active: path === '/five-why' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="gradient-text">Defect RCA</h1>
      </div>
      
      <div className="navbar-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <div className={`step ${step.active ? 'active' : ''} ${(index < steps.findIndex(s => s.active)) ? 'completed' : ''}`}>
              <div className="step-circle">{step.num}</div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className="step-line" />}
          </React.Fragment>
        ))}
      </div>
      
      <div className="navbar-right">
        <button className="btn btn-ghost settings-btn" onClick={onOpenSettings} title="Configure AI Provider">
          ⚙️ Setup AI Provider
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
