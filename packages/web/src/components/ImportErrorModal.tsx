/**
 * Modal for displaying import errors with technical details
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useIntl } from 'react-intl';

interface ImportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  technicalDetails?: string;
}

export function ImportErrorModal({
  isOpen,
  onClose,
  errorMessage,
  technicalDetails,
}: ImportErrorModalProps) {
  const intl = useIntl();
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-lg">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <AlertTriangle className="text-error shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-lg">{intl.formatMessage({ id: 'error.importTitle' })}</h3>
            <p className="py-2 text-base-content/80">{errorMessage}</p>
          </div>
        </div>

        {technicalDetails && (
          <div className="mt-4">
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? intl.formatMessage({ id: 'error.hideDetails' }) : intl.formatMessage({ id: 'error.showDetails' })}
            </button>

            {showDetails && (
              <pre className="mt-2 p-3 bg-base-300 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                {technicalDetails}
              </pre>
            )}
          </div>
        )}

        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>
            {intl.formatMessage({ id: 'error.close' })}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
    </div>
  );
}
