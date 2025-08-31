/**
 * Wrapper pre ReturnProtocolFormV2 
 * Mapuje V1 props na V2 props
 */

import React from 'react';

interface V1Props {
  open: boolean;
  rental: any;
  handoverProtocol: any;
  onSave: (protocol: any) => void;
  onClose: () => void;
}

const ReturnProtocolFormV2Wrapper: React.FC<V1Props> = ({
  open,
  rental,
  handoverProtocol,
  onSave,
  onClose,
}) => {
  if (!open) return null;

  // TODO: Implement V2 return protocol form
  // For now, return a placeholder
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Preberací protokol V2
            <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Coming Soon
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-gray-600">
            Return Protocol V2 je vo vývoji.
            Použite štandardný formulár.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnProtocolFormV2Wrapper;
