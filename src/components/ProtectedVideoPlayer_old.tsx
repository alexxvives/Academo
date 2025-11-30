'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  studentName: string;
  studentEmail: string;
}

interface PlayState {
  lastPositionSeconds: number;
  furthestPositionSeconds: number;
  playsCompleted: number;
  lastWatchedAt: string | null;
}

interface VideoSettings {
  maxPlays: number;
  maxSeekBackMinutes: number;
}

interface WatermarkPosition {
  top: string;
  left: string;
}

export default function ProtectedVideoPlayer({
  videoId,
  title,
  studentName,
  studentEmail,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playState, setPlayState] = useState<PlayState | null>(null);
  const [settings, setSettings] = useState<VideoSettings | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>({
    top: '10%',
    left: '10%',
  });
  const [showWatermark, setShowWatermark] = useState(true);

  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const watermarkInterval = useRef<NodeJS.Timeout | null>(null);

  // Load initial play state and settings
  useEffect(() => {
    loadPlayState();
  }, [videoId]);

  // Setup watermark position changes
  useEffect(() => {
    const positions: WatermarkPosition[] = [
      { top: '10%', left: '10%' },
      { top: '10%', left: '80%' },
      { top: '80%', left: '10%' },
      { top: '80%', left: '80%' },
      { top: '45%', left: '45%' },
    ];

    const changeWatermarkPosition = () => {
      const randomPosition = positions[Math.floor(Math.random() * positions.length)];
      setWatermarkPosition(randomPosition);
      
      // Show watermark for 10-15 seconds
      setShowWatermark(true);
      setTimeout(() => {
        setShowWatermark(false);
      }, 10000 + Math.random() * 5000);
    };

    // Change position every 2-4 minutes
    watermarkInterval.current = setInterval(
      changeWatermarkPosition,
      (120 + Math.random() * 120) * 1000
    );

    // Initial watermark
    changeWatermarkPosition();

    return () => {
      if (watermarkInterval.current) {
        clearInterval(watermarkInterval.current);
      }
    };
  }, []);

  // Setup progress tracking
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      progressUpdateInterval.current = setInterval(() => {
        updateProgress();
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, [isPlaying, currentTime]);

  const loadPlayState = async () => {
    try {
      const response = await fetch(`/api/video/progress?videoId=${videoId}`);
      const result = await response.json();

      if (result.success) {
        setPlayState(result.data.playState);
        setSettings(result.data.settings);

        // Check if max plays reached
        if (
          result.data.playState.playsCompleted >= result.data.settings.maxPlays
        ) {
          setError('You have reached the maximum number of plays for this video.');
        }

        // Set video to last position
        if (videoRef.current && result.data.playState.lastPositionSeconds > 0) {
          videoRef.current.currentTime = result.data.playState.lastPositionSeconds;
        }
      }
    } catch (err) {
      console.error('Failed to load play state:', err);
      setError('Failed to load video state.');
    }
  };

  const updateProgress = async () => {
    if (!videoRef.current || !duration) return;

    const currentTime = videoRef.current.currentTime;

    try {
      const response = await fetch('/api/video/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          currentTime,
          duration,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPlayState(result.data.playState);

        // Check if max plays reached
        if (
          result.data.playState.playsCompleted >= settings?.maxPlays!
        ) {
          videoRef.current.pause();
          setError('You have reached the maximum number of plays for this video.');
        }
      } else {
        console.error('Failed to update progress:', result.error);
        
        // Handle seek-back restriction error
        if (result.error?.includes('Cannot seek back')) {
          videoRef.current.currentTime = playState?.furthestPositionSeconds || 0;
          setError(result.error);
          setTimeout(() => setError(null), 3000);
        }
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    updateProgress(); // Save progress on pause
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      // Enforce seek-back limit
      if (playState && settings) {
        const maxSeekBackSeconds = settings.maxSeekBackMinutes * 60;
        const allowedMinPosition = Math.max(
          0,
          playState.furthestPositionSeconds - maxSeekBackSeconds
        );

        if (current < allowedMinPosition) {
          videoRef.current.currentTime = allowedMinPosition;
          setError(
            `You cannot seek back more than ${settings.maxSeekBackMinutes} minutes.`
          );
          setTimeout(() => setError(null), 3000);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playsRemaining = settings && playState
    ? settings.maxPlays - playState.playsCompleted
    : 0;

  if (error && playState && playState.playsCompleted >= (settings?.maxPlays || 0)) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-white text-center">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <p className="text-red-400">{error}</p>
        <p className="text-gray-400 mt-4">
          You have watched this video {playState.playsCompleted} time(s).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black"
          src={`/api/video/stream/${videoId}`}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Watermark Overlay */}
        {showWatermark && (
          <div
            className="absolute pointer-events-none transition-all duration-1000"
            style={{
              top: watermarkPosition.top,
              left: watermarkPosition.left,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="bg-black bg-opacity-40 px-3 py-2 rounded text-white text-sm font-mono select-none">
              <div>{studentName}</div>
              <div className="text-xs opacity-75">{studentEmail}</div>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && !playState?.playsCompleted && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg">
            {error}
          </div>
        )}

        {/* Plays Remaining Badge */}
        {settings && playState && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">
            Plays: {playsRemaining}/{settings.maxPlays}
          </div>
        )}
      </div>

      {/* Custom Controls */}
      <div className="p-4 bg-gray-800">
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                (currentTime / duration) * 100
              }%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-white text-sm">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="text-gray-400 text-sm">
            {playState && (
              <span>
                Last watched:{' '}
                {playState.lastWatchedAt
                  ? new Date(playState.lastWatchedAt).toLocaleDateString()
                  : 'Never'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
