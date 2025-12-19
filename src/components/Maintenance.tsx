import { useEffect, useRef } from 'react';

const Maintenance = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Set a distinctive title when in maintenance mode
    document.title = 'System Maintenance';
    
    // Prevent any background API calls or user interactions
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Play the video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Auto-play prevented:', error);
      });
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <video 
            ref={videoRef}
            src="/under maintanance.mp4" 
            loop 
            muted 
            playsInline
            className="w-48 h-48 object-contain"
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Under Maintenance
          </h1>
          
          <p className="text-xl text-gray-300">
            We're currently performing scheduled maintenance to improve your experience.
          </p>
          
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <p className="text-lg text-gray-200">
              Please mark your attendance manually with your manager.
            </p>
          </div>
          
          <div className="mt-8 text-gray-400">
            <p>We apologize for any inconvenience and appreciate your patience.</p>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-4 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} SAMS. All rights reserved.
      </footer>
    </div>
  );
};

export default Maintenance;