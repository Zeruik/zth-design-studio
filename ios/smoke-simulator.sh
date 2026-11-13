#!/usr/bin/env bash
set -euo pipefail
mkdir -p ios/build
xcrun simctl list devices available --json > ios/build/simulator-devices.json
device_id=$(python3 - <<'PY'
import json, re
with open('ios/build/simulator-devices.json') as source:
    runtimes = json.load(source)['devices']
def version(runtime):
    return tuple(map(int, re.findall(r'\d+', runtime)))
for runtime in sorted(runtimes, key=version, reverse=True):
    if '.iOS-' not in runtime:
        continue
    for device in runtimes[runtime]:
        if device.get('isAvailable') and device['name'].startswith('iPhone'):
            print(device['udid'])
            raise SystemExit(0)
raise SystemExit('No available iPhone simulator runtime')
PY
)
echo "Using simulator $device_id"
device_state=$(python3 - "$device_id" <<'PY'
import json, sys
with open('ios/build/simulator-devices.json') as source:
    devices = json.load(source)['devices']
print(next(d['state'] for group in devices.values() for d in group if d['udid'] == sys.argv[1]))
PY
)
if [ "$device_state" != "Booted" ]; then xcrun simctl boot "$device_id"; fi
xcrun simctl bootstatus "$device_id" -b
xcrun simctl install "$device_id" ios/build/Build/Products/Release-iphonesimulator/ZTHDesignStudio.app
xcrun simctl launch --terminate-running-process "$device_id" studio.zerotohand.design
sleep 15
xcrun simctl io "$device_id" screenshot ios/build/ios-simulator-home.png
xcrun simctl shutdown "$device_id"
