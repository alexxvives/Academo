'use client';

import { useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useStreamsData, Stream } from '@/hooks/useStreamsData';
import { StreamsHeader } from './components/StreamsHeader';
import { StreamsTable } from './components/StreamsTable';

export default function StreamsPage() {
  const { streams, setStreams, classes, academyName, loading } = useStreamsData();
  const [selectedClass, setSelectedClass] = useState('all');
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);

  const openDeleteConfirmation = (streamId: string, streamTitle: string) => {
    if (!confirm(`¿Estás seguro que deseas eliminar el stream "${streamTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    handleDeleteStream(streamId);
  };

  const updateStream = (streamId: string, updates: Partial<Stream>) => {
    setStreams(prev => prev.map(s => s.id === streamId ? { ...s, ...updates } : s));
  };

  const handleDeleteStream = async (streamId: string) => {
    setDeletingStreamId(streamId);
    
    try {
      const response = await apiClient(`/live/${streamId}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        setStreams(streams.filter(s => s.id !== streamId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      alert('Error al eliminar stream');
    } finally {
      setDeletingStreamId(null);
    }
  };

  const filteredStreams = useMemo(() => {
    if (selectedClass === 'all') return streams;
    return streams.filter(s => s.classId === selectedClass);
  }, [streams, selectedClass]);

  return (
    <div className="space-y-6">
      <StreamsHeader 
        academyName={academyName}
        classes={classes}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
      />

      <StreamsTable
        streams={filteredStreams}
        loading={loading}
        deletingStreamId={deletingStreamId}
        onDelete={openDeleteConfirmation}
        onUpdateStream={updateStream}
      />
    </div>
  );
}
