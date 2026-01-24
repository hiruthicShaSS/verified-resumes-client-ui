import React from 'react';
import './common.css';
import './InformationTab.css';

const InformationTab: React.FC = () => {
  return (
    <div className="information-tab-wrapper">
      <div className="information-tab-content">
        <h2 className="tab-content-title">Informations</h2>
        <p className="tab-content-text">Please provide the necessary information to proceed.</p>
        {/* Add your informations form/content here */}
      </div>
    </div>
  );
};

export default InformationTab;

