import React from 'react';
import OneClickCloneWizard from './OneClickCloneWizard';

interface CreateGhostWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGhostWizard: React.FC<CreateGhostWizardProps> = ({ isOpen, onClose }) => {
  return <OneClickCloneWizard isOpen={isOpen} onClose={onClose} isEmbedded={false} />;
};

export default CreateGhostWizard;
