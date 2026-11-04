import { formatReserve } from './timer';
import type { GameNotification } from './game';

export function createGameNotifications(container: HTMLElement) {
  return {
    show(change: GameNotification): void {
      const completed = 'kind' in change;
      if (!completed && (!Number.isFinite(change.amount) || change.amount === 0)) return;
      const toast = document.createElement('div');
      toast.className = `time-notification ${completed || change.amount > 0 ? 'gain' : 'loss'}`;
      const amount = document.createElement('strong');
      amount.textContent = completed ? 'Training complete' : `${change.amount > 0 ? '+' : '−'}${formatReserve(Math.abs(change.amount))}`;
      const reason = document.createElement('span');
      reason.textContent = completed ? `${change.course} certification` : change.reason;
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'dismiss-notification';
      close.setAttribute('aria-label', 'Dismiss notification');
      close.textContent = '×';
      close.addEventListener('click', () => toast.remove());
      toast.append(amount, reason, close);
      container.append(toast);
      while (container.childElementCount > 4) container.firstElementChild?.remove();
      window.setTimeout(() => toast.remove(), 4500);
    },
    clear(): void { container.replaceChildren(); },
  };
}
