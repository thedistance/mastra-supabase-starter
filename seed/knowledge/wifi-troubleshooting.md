# Wi-Fi Troubleshooting

If your Aurora Thermostat shows a grey Wi-Fi icon or won't connect to the app, work through
these steps in order.

## 1. Check the network band

Aurora Thermostats only connect to 2.4GHz Wi-Fi networks. Many home routers broadcast a
combined "smart" network name that includes both 2.4GHz and 5GHz bands, which can cause the
thermostat to attempt (and fail) a 5GHz connection. If your router supports it, temporarily
split the bands into separate network names during setup, then merge them back afterward if
you prefer.

## 2. Check the distance from your router

The thermostat's Wi-Fi radio has an effective range of about 9 metres through a single
interior wall. If your thermostat is more than two walls away from your router, consider a
Wi-Fi extender or a mesh node in a central location.

## 3. Restart the thermostat

Hold the dial for 10 seconds until the display shows the Aurora logo. This performs a soft
restart without erasing your schedule or Wi-Fi credentials.

## 4. Forget and re-add the network

In the Aurora Home app, go to **Settings > Device > Network** and select **Forget Network**.
Then repeat the Wi-Fi setup flow described in `getting-started.md`.

## 5. Check for a firmware update

Firmware updates occasionally fix Wi-Fi driver issues. Go to **Settings > Device > Firmware**
in the app. Updates are pushed automatically when your thermostat is online, but you can
trigger a manual check from this screen.

## Error code reference

- **W-101**: Incorrect Wi-Fi password entered during setup.
- **W-204**: Network found but the thermostat couldn't reach the internet (check your
  router's internet connection separately).
- **W-310**: Router is using a 5GHz-only network; switch to or add a 2.4GHz network.
- **W-450**: Too many devices on the network; some routers cap simultaneous connections.

## Still stuck?

If none of these steps resolve the issue, contact support with your error code and the
thermostat's serial number, printed on a sticker on the back of the display unit.
