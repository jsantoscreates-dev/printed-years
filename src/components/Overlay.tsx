'use client';

interface OverlayProps {
  isModalOpen?: boolean;
}

export function Overlay({ isModalOpen = false }: OverlayProps) {
  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none"
      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      {/* Logo - top center */}
      <a
        href="/"
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto no-underline"
        style={{
          top: '24px',
        }}
      >
        <img
          src="/Logo/Logo.svg"
          alt="jsantoscreates"
          style={{
            height: '96px',
            width: 'auto',
          }}
        />
      </a>

      {/* Footer - full width */}
      {!isModalOpen && (
        <div
          className="fixed left-0 right-0 flex justify-between items-center pointer-events-auto"
          style={{
            bottom: '24px',
            padding: '0 24px',
            fontSize: '24px',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.01em',
            color: '#FFFFFF',
          }}
        >
          <span>©jsantoscreates. all rights reserved.</span>
          <div className="flex gap-6">
            <a href="mailto:jsantoscreates@gmail.com" className="hover:opacity-70 transition-opacity" style={{ color: '#FFFFFF', textDecoration: 'none' }}>email</a>
            <a href="https://www.linkedin.com/in/jorge-santos-64bb52206/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" style={{ color: '#FFFFFF', textDecoration: 'none' }}>linkedin</a>
            <a href="https://www.instagram.com/jsantoscreates/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" style={{ color: '#FFFFFF', textDecoration: 'none' }}>instagram</a>
          </div>
        </div>
      )}
    </div>
  );
}
