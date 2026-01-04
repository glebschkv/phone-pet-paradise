import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineStatusIndicator, OfflineStatusDot } from '@/components/OfflineStatusIndicator';

// Mock the OfflineContext
const mockSyncNow = vi.fn();
let mockOfflineState = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  hasPendingSync: false,
  syncNow: mockSyncNow,
};

vi.mock('@/contexts/OfflineContext', () => ({
  useOffline: () => mockOfflineState,
}));

describe('OfflineStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOfflineState = {
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      hasPendingSync: false,
      syncNow: mockSyncNow,
    };
  });

  describe('Online State', () => {
    it('does not render when online with no pending sync', () => {
      const { container } = render(<OfflineStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when showAlways is true even when fully synced', () => {
      render(<OfflineStatusIndicator showAlways />);
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });
  });

  describe('Offline State', () => {
    beforeEach(() => {
      mockOfflineState.isOnline = false;
    });

    it('renders offline indicator when offline', () => {
      render(<OfflineStatusIndicator />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('displays correct offline title', () => {
      render(<OfflineStatusIndicator />);
      const element = screen.getByText('Offline').closest('div');
      expect(element).toHaveAttribute('title', 'You are offline. Data is saved locally.');
    });
  });

  describe('Syncing State', () => {
    beforeEach(() => {
      mockOfflineState.isOnline = true;
      mockOfflineState.isSyncing = true;
    });

    it('renders syncing indicator when syncing', () => {
      render(<OfflineStatusIndicator />);
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });
  });

  describe('Pending Sync State', () => {
    beforeEach(() => {
      mockOfflineState.isOnline = true;
      mockOfflineState.hasPendingSync = true;
      mockOfflineState.pendingCount = 5;
    });

    it('renders pending count when has pending sync', () => {
      render(<OfflineStatusIndicator />);
      expect(screen.getByText('5 pending')).toBeInTheDocument();
    });

    it('displays correct pending title', () => {
      render(<OfflineStatusIndicator />);
      const element = screen.getByText('5 pending').closest('div');
      expect(element).toHaveAttribute('title', '5 pending updates. Click to sync.');
    });

    it('triggers sync when clicked with pending items', () => {
      render(<OfflineStatusIndicator />);
      const indicator = screen.getByText('5 pending').closest('div');
      fireEvent.click(indicator!);
      expect(mockSyncNow).toHaveBeenCalledTimes(1);
    });

    it('has button role when has pending sync', () => {
      render(<OfflineStatusIndicator />);
      const element = screen.getByText('5 pending').closest('div');
      expect(element).toHaveAttribute('role', 'button');
    });
  });

  describe('Click Handler', () => {
    it('does not trigger sync when offline', () => {
      mockOfflineState.isOnline = false;
      mockOfflineState.hasPendingSync = true;

      render(<OfflineStatusIndicator />);
      const indicator = screen.getByText('Offline').closest('div');
      fireEvent.click(indicator!);
      expect(mockSyncNow).not.toHaveBeenCalled();
    });

    it('does not trigger sync when already syncing', () => {
      mockOfflineState.isSyncing = true;
      mockOfflineState.hasPendingSync = true;

      render(<OfflineStatusIndicator />);
      const indicator = screen.getByText('Syncing...').closest('div');
      fireEvent.click(indicator!);
      expect(mockSyncNow).not.toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      mockOfflineState.isOnline = false;

      render(<OfflineStatusIndicator className="custom-class" />);
      const element = screen.getByText('Offline').closest('div');
      expect(element).toHaveClass('custom-class');
    });
  });
});

describe('OfflineStatusDot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOfflineState = {
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      hasPendingSync: false,
      syncNow: mockSyncNow,
    };
  });

  describe('Visibility', () => {
    it('does not render when online and synced', () => {
      const { container } = render(<OfflineStatusDot />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when offline', () => {
      mockOfflineState.isOnline = false;

      const { container } = render(<OfflineStatusDot />);
      expect(container.firstChild).not.toBeNull();
    });

    it('renders when has pending sync', () => {
      mockOfflineState.hasPendingSync = true;

      const { container } = render(<OfflineStatusDot />);
      expect(container.firstChild).not.toBeNull();
    });

    it('renders when syncing', () => {
      mockOfflineState.isSyncing = true;

      const { container } = render(<OfflineStatusDot />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Styling', () => {
    it('has offline styling when offline', () => {
      mockOfflineState.isOnline = false;

      render(<OfflineStatusDot />);
      const dot = screen.getByTitle('Offline');
      expect(dot).toHaveClass('bg-amber-500');
    });

    it('has pending styling when pending sync', () => {
      mockOfflineState.hasPendingSync = true;

      render(<OfflineStatusDot />);
      const dot = screen.getByTitle('Pending sync');
      expect(dot).toHaveClass('bg-blue-500');
    });

    it('has syncing styling when syncing', () => {
      mockOfflineState.isSyncing = true;

      render(<OfflineStatusDot />);
      const dot = screen.getByTitle('Syncing...');
      expect(dot).toHaveClass('bg-blue-500');
      expect(dot).toHaveClass('animate-pulse');
    });

    it('applies custom className', () => {
      mockOfflineState.isOnline = false;

      render(<OfflineStatusDot className="custom-class" />);
      const dot = screen.getByTitle('Offline');
      expect(dot).toHaveClass('custom-class');
    });
  });
});
