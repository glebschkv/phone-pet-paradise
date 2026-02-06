/**
 * useSessionNotes Hook
 *
 * Handles saving and loading session notes.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useCallback } from 'react';
import { timerLogger } from '@/lib/logger';
import { STORAGE_CONFIG } from '@/lib/constants';

const SESSION_NOTES_KEY = 'petIsland_sessionNotes';

export interface SessionNote {
  id: number;
  notes: string;
  rating: number;
  sessionDuration: number;
  category?: string;
  taskLabel?: string;
  xpEarned: number;
  timestamp: string;
}

interface SessionNoteData {
  notes: string;
  rating: number;
  sessionDuration: number;
  category?: string;
  taskLabel?: string;
  xpEarned: number;
}

export function useSessionNotes() {
  /**
   * Save a session note to localStorage
   */
  const saveSessionNote = useCallback((data: SessionNoteData): boolean => {
    try {
      const existingNotes = localStorage.getItem(SESSION_NOTES_KEY);
      const notesArray: SessionNote[] = existingNotes ? JSON.parse(existingNotes) : [];

      // Add the new note with metadata
      notesArray.push({
        id: Date.now(),
        notes: data.notes,
        rating: data.rating,
        sessionDuration: data.sessionDuration,
        category: data.category,
        taskLabel: data.taskLabel,
        xpEarned: data.xpEarned,
        timestamp: new Date().toISOString(),
      });

      // Keep only the last N notes to prevent storage bloat
      const trimmedNotes = notesArray.slice(-STORAGE_CONFIG.MAX_SESSION_NOTES);
      localStorage.setItem(SESSION_NOTES_KEY, JSON.stringify(trimmedNotes));

      return true;
    } catch (error) {
      timerLogger.error('Failed to save session notes:', error);
      return false;
    }
  }, []);

  /**
   * Load all session notes from localStorage
   */
  const loadSessionNotes = useCallback((): SessionNote[] => {
    try {
      const existingNotes = localStorage.getItem(SESSION_NOTES_KEY);
      return existingNotes ? JSON.parse(existingNotes) : [];
    } catch (error) {
      timerLogger.error('Failed to load session notes:', error);
      return [];
    }
  }, []);

  /**
   * Get session notes for a specific date range
   */
  const getNotesForDateRange = useCallback((startDate: Date, endDate: Date): SessionNote[] => {
    const notes = loadSessionNotes();
    return notes.filter(note => {
      const noteDate = new Date(note.timestamp);
      return noteDate >= startDate && noteDate <= endDate;
    });
  }, [loadSessionNotes]);

  /**
   * Get session notes for today
   */
  const getTodaysNotes = useCallback((): SessionNote[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getNotesForDateRange(today, tomorrow);
  }, [getNotesForDateRange]);

  /**
   * Clear all session notes
   */
  const clearSessionNotes = useCallback((): boolean => {
    try {
      localStorage.removeItem(SESSION_NOTES_KEY);
      return true;
    } catch (error) {
      timerLogger.error('Failed to clear session notes:', error);
      return false;
    }
  }, []);

  /**
   * Delete a specific session note by ID
   */
  const deleteSessionNote = useCallback((noteId: number): boolean => {
    try {
      const notes = loadSessionNotes();
      const filteredNotes = notes.filter(note => note.id !== noteId);
      localStorage.setItem(SESSION_NOTES_KEY, JSON.stringify(filteredNotes));
      return true;
    } catch (error) {
      timerLogger.error('Failed to delete session note:', error);
      return false;
    }
  }, [loadSessionNotes]);

  /**
   * Get session statistics
   */
  const getSessionStats = useCallback(() => {
    const notes = loadSessionNotes();
    const totalSessions = notes.length;
    const totalMinutes = notes.reduce((sum, note) => sum + note.sessionDuration / 60, 0);
    const totalXP = notes.reduce((sum, note) => sum + note.xpEarned, 0);
    const averageRating = totalSessions > 0
      ? notes.reduce((sum, note) => sum + note.rating, 0) / totalSessions
      : 0;

    return {
      totalSessions,
      totalMinutes: Math.round(totalMinutes),
      totalXP,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }, [loadSessionNotes]);

  return {
    saveSessionNote,
    loadSessionNotes,
    getNotesForDateRange,
    getTodaysNotes,
    clearSessionNotes,
    deleteSessionNote,
    getSessionStats,
  };
}
