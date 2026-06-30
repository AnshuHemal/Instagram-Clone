type Listener = () => void;

class FavoritesStore {
  // Let's populate it with a default user '_himanshi_dudani_' as suggested in the screenshot
  private selectedUserIds: string[] = ['1']; // Mock ID for _himanshi_dudani_
  private listeners: Set<Listener> = new Set();

  getFavoritesCount(): number {
    return this.selectedUserIds.length;
  }

  getSelectedUserIds(): string[] {
    return this.selectedUserIds;
  }

  setSelectedUserIds(ids: string[]) {
    this.selectedUserIds = ids;
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const favoritesStore = new FavoritesStore();
