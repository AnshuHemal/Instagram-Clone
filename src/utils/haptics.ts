import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility — wraps expo-haptics with app-specific patterns.
 *
 * Usage:
 *   import { haptics } from '@/utils/haptics';
 *   haptics.light();        // subtle feedback
 *   haptics.medium();       // standard feedback
 *   haptics.heavy();        // strong feedback
 *   haptics.success();      // success pattern
 *   haptics.warning();      // warning pattern
 *   haptics.error();        // error pattern
 *   haptics.selection();    // picker/scroll selection
 *   haptics.impact(Haptics.ImpactFeedbackStyle.Heavy); // custom
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

class HapticsService {
  private enabled: boolean = true;

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private async trigger(callback: () => Promise<void> | void) {
    if (!this.enabled) return;
    try {
      await callback();
    } catch (err) {
      // Haptics should never crash the app
    }
  }

  light() {
    return this.trigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }

  medium() {
    return this.trigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }

  heavy() {
    return this.trigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  }

  success() {
    return this.trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }

  warning() {
    return this.trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  }

  error() {
    return this.trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }

  selection() {
    return this.trigger(() => Haptics.selectionAsync());
  }

  /**
   * Custom impact with explicit style.
   */
  impact(style: Haptics.ImpactFeedbackStyle) {
    return this.trigger(() => Haptics.impactAsync(style));
  }

  /**
   * Triggered on tab switch.
   */
  onTabSwitch() {
    return this.light();
  }

  /**
   * Triggered on like/unlike.
   */
  onLike() {
    return this.impact(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Triggered on pull-to-refresh.
   */
  onRefresh() {
    return this.selection();
  }

  /**
   * Triggered on long-press.
   */
  onLongPress() {
    return this.impact(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Triggered on double-tap heart.
   */
  onDoubleTap() {
    return this.impact(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Triggered on button press.
   */
  onButtonPress() {
    return this.light();
  }

  /**
   * Triggered on follow/unfollow.
   */
  onFollow() {
    return this.success();
  }

  /**
   * Triggered on comment added.
   */
  onComment() {
    return this.light();
  }

  /**
   * Triggered on error.
   */
  onError() {
    return this.error();
  }
}

export const haptics = new HapticsService();