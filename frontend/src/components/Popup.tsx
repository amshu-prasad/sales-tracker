// components/ErrorModal.tsx
import React from 'react';
import ReactDOM from 'react-dom';

interface ErrorModalProps {
  onClose: () => void;
}

const Popup: React.FC<ErrorModalProps> = ({ onClose }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <p className="text-center text-lg font-bold">
          You do not have the necessary permissions to access this resource.
        </p>
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              onClose();
              // window.location.href =  process.env.NEXT_PUBLIC_HINTON_BASE_PATH || "";
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Ok
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Popup;


