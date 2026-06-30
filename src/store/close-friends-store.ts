type Listener = () => void;

class CloseFriendsStore {
  private selectedUserIds: string[] = [];
  private listeners: Set<Listener> = new Set();

  getCloseFriendsCount(): number {
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

export const closeFriendsStore = new CloseFriendsStore();
