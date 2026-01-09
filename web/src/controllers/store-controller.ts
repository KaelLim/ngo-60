import type { ReactiveController, ReactiveControllerHost } from 'lit';

interface Subscribable {
  subscribe(listener: () => void): () => void;
}

export class StoreController<T extends Subscribable> implements ReactiveController {
  private unsubscribe?: () => void;

  constructor(
    private host: ReactiveControllerHost,
    public store: T
  ) {
    host.addController(this);
  }

  hostConnected() {
    this.unsubscribe = this.store.subscribe(() => {
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this.unsubscribe?.();
  }
}
