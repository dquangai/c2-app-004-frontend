import React, { useEffect } from 'react';
import ProfileDetail from '../../../pages/ProfileDetail/ProfileDetail';
import './ProfileDrawer.css';

const ProfileDrawer = ({ isOpen, onClose, profileId, profile }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedId = profileId || profile?.id;

  return (
    <div className="profile-drawer-overlay" onClick={onClose}>
      <div 
        className="profile-drawer-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <ProfileDetail
          profileId={resolvedId}
          initialProfile={profile}
          onClose={onClose}
          isDrawer={true}
        />
      </div>
    </div>
  );
};

export default ProfileDrawer;
