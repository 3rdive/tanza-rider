# Sound Assets

This folder contains sound files for the app notifications.

## Adding Notification Sound

To add a notification sound for delivery requests:

1. Add a sound file named `notification.mp3` to this folder
2. Uncomment the sound code in `DeliveryRequestSnackbar.tsx` in the `triggerNotification` function
3. The sound will play along with vibration and haptic feedback when new delivery requests arrive

## Recommended Sound Properties

- Format: MP3 or WAV
- Duration: 1-3 seconds
- Volume: Clear but not jarring
- Tone: Attention-grabbing but professional

## Example Sound Sources

- Use free notification sounds from:
  - Freesound.org
  - Zapsplat (with account)
  - Create custom sounds using audio editing software

Make sure any sounds used are royalty-free and appropriate for commercial use.