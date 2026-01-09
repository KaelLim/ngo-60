import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { AppStore } from '../stores/app-store.js';

export class GestureController implements ReactiveController {
  private startY = 0;
  private currentY = 0;
  private contentTouchStartY = 0;
  private isContentDragging = false;

  constructor(
    private host: ReactiveControllerHost & HTMLElement,
    private store: AppStore,
    private getContainer: () => HTMLElement | null,
    private getScrollContent: () => HTMLElement | null
  ) {
    host.addController(this);
  }

  hostConnected() {
    // Listeners will be added to the container element
  }

  hostDisconnected() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  // Touch handlers
  onTouchStart = (e: TouchEvent) => {
    if (this.store.currentPage) return;

    // In full state, check if touch is on scrollable content
    if (this.store.sheetState === 'full') {
      const scrollContent = this.getScrollContent();
      if (scrollContent && scrollContent.contains(e.target as Node)) {
        if (scrollContent.scrollTop <= 0) {
          this.contentTouchStartY = e.touches[0].clientY;
          this.isContentDragging = true;
        }
        return;
      }
    }

    this.store.setIsDragging(true);
    this.startY = e.touches[0].clientY;
    this.currentY = this.store.containerY;
  };

  onTouchMove = (e: TouchEvent) => {
    // Handle pull-to-close in full state
    if (this.isContentDragging && this.store.sheetState === 'full') {
      const scrollContent = this.getScrollContent();
      const deltaY = e.touches[0].clientY - this.contentTouchStartY;

      if (deltaY > 0 && scrollContent && scrollContent.scrollTop <= 0) {
        e.preventDefault();
        const fullPos = this.store.getSnapPosition('full');
        this.store.setContainerY(fullPos + (deltaY * 0.3));
      }
      return;
    }

    if (!this.store.isDragging) return;

    if (this.store.sheetState !== 'full') {
      e.preventDefault();
    }

    const deltaY = e.touches[0].clientY - this.startY;
    const peekPos = this.store.getSnapPosition('peek');
    const fullPos = this.store.getSnapPosition('full');

    let newY = this.currentY + deltaY;

    // Rubber band effect
    if (newY > peekPos) {
      newY = peekPos + (newY - peekPos) * 0.2;
    }
    if (newY < fullPos) {
      newY = fullPos + (newY - fullPos) * 0.2;
    }

    this.store.setContainerY(newY);
  };

  onTouchEnd = (e: TouchEvent) => {
    // Handle pull-to-close in full state
    if (this.isContentDragging && this.store.sheetState === 'full') {
      const deltaY = e.changedTouches[0].clientY - this.contentTouchStartY;
      this.isContentDragging = false;

      if (deltaY > 80) {
        this.store.setSheetState('preview');
      } else {
        this.store.setSheetState('full');
      }
      return;
    }

    if (!this.store.isDragging) return;
    this.store.setIsDragging(false);

    const deltaY = e.changedTouches[0].clientY - this.startY;
    this.store.snapToClosestState(this.store.containerY, deltaY);
  };

  // Mouse handlers
  onMouseDown = (e: MouseEvent) => {
    if (this.store.currentPage) return;

    this.store.setIsDragging(true);
    this.startY = e.clientY;
    this.currentY = this.store.containerY;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.store.isDragging) return;

    const deltaY = e.clientY - this.startY;
    const peekPos = this.store.getSnapPosition('peek');
    const fullPos = this.store.getSnapPosition('full');

    let newY = this.currentY + deltaY;

    if (newY > peekPos) {
      newY = peekPos + (newY - peekPos) * 0.2;
    }
    if (newY < fullPos) {
      newY = fullPos + (newY - fullPos) * 0.2;
    }

    this.store.setContainerY(newY);
  };

  private onMouseUp = (e: MouseEvent) => {
    if (!this.store.isDragging) return;
    this.store.setIsDragging(false);

    const deltaY = e.clientY - this.startY;
    this.store.snapToClosestState(this.store.containerY, deltaY);

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };
}
