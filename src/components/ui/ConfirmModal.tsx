import React from 'react';
import { AppModal } from './AppModal';
import { AppButton } from './AppButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}: ConfirmModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end space-x-3 w-full">
          <AppButton variant="secondary" onClick={onClose}>
            {cancelText}
          </AppButton>
          <AppButton 
            variant={isDestructive ? 'primary' : 'primary'} // TODO: Add destructive variant to AppButton if needed
            className={isDestructive ? 'bg-red-600 hover:bg-red-700 text-white ring-red-600' : ''}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </AppButton>
        </div>
      }
    >
      <div className="flex items-start space-x-4">
        {isDestructive && (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <p className="text-[14px] text-text-secondary leading-relaxed pt-1">
          {message}
        </p>
      </div>
    </AppModal>
  );
}
