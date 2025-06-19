import { useEffect, useRef } from 'react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  darkMode = true,
}) => {
  const modalRef = useRef();
  
  const modalSizes = {
    xs: 'max-w-xs',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const closeButtonColor = darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700';

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className={`${modalSizes[size] || modalSizes.md} w-full ${bgColor} rounded-xl shadow-xl transform transition-all duration-300 animate-scale-in border border-${borderColor}`}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-5 border-b ${borderColor}`}>
          <h3 className={`text-xl font-semibold ${textColor}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`${closeButtonColor} focus:outline-none`}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className={`p-5 overflow-y-auto max-h-[70vh] ${textColor}`}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className={`p-5 border-t ${borderColor} flex justify-end space-x-3`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
