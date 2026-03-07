import { WebHaptics } from 'web-haptics';

const h = WebHaptics.isSupported ? new WebHaptics() : null;

// Light tick — nav buttons, card taps
export const hapticLight = () => h?.trigger(12);

// Medium — tab switches, service selection expand
export const hapticMedium = () => h?.trigger(22);

// Success — form submit, appointment request
export const hapticSuccess = () => h?.trigger('success');

// Warning — form validation error
export const hapticWarning = () => h?.trigger('warning');
