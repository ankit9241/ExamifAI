import { useCallback, useEffect, useState } from 'react';

export default function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)
  );

  const enter = useCallback(async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      // Handle permission errors gracefully
      console.error('Fullscreen request failed:', err);
    }
  }, []);

  const exit = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }, []);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(
        !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)
      );
    }
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('mozfullscreenchange', handleChange);
    document.addEventListener('MSFullscreenChange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
      document.removeEventListener('MSFullscreenChange', handleChange);
    };
  }, []);

  return { isFullscreen, enter, exit };
} 