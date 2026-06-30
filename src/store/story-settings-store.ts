type Listener = () => void;

class StorySettingsStore {
  private hiddenUserIds: string[] = [];
  private listeners: Set<Listener> = new Set();

  getHiddenCount(): number {
    return this.hiddenUserIds.length;
  }

  getHiddenUserIds(): string[] {
    return this.hiddenUserIds;
  }

  setHiddenUserIds(ids: string[]) {
    this.hiddenUserIds = ids;
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

export const storySettingsStore = new StorySettingsStore();
