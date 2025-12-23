# Location Mapping Configuration Guide

## Overview
The `location-mapping.json` file maps security system account numbers and zones to real-world geographic coordinates in Bangalore. This allows alerts to be displayed on an interactive map.

## File Location
```
/home/akshay/Documents/BoschAlertHub/location-mapping.json
```

## Structure

### Account Configuration
Each account represents a physical security site with multiple zones:

```json
{
  "accounts": {
    "3333": {
      "name": "Site Name",
      "city": "Bangalore",
      "state": "Karnataka",
      "country": "India",
      "centerCoordinates": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "zones": {
        "BA0008": {
          "name": "Zone Display Name",
          "type": "entry_point",
          "location": "Area Description",
          "coordinates": {
            "lat": 12.9750,
            "lng": 77.5920
          },
          "description": "Detailed zone description"
        }
      }
    }
  }
}
```

## How to Add a New Account

1. Open `location-mapping.json` in a text editor
2. Add a new entry under `"accounts"`:

```json
"4444": {
  "name": "New Security Site",
  "city": "Bangalore",
  "state": "Karnataka",
  "country": "India",
  "centerCoordinates": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "zones": {}
}
```

3. Don't forget to add a comma after the previous account

## How to Add a New Zone to an Existing Account

1. Find the account in `location-mapping.json`
2. Add a new zone under `"zones"`:

```json
"NEW_ZONE_01": {
  "name": "Zone Name",
  "type": "entry_point",
  "location": "Building/Area Name",
  "coordinates": {
    "lat": 12.9750,
    "lng": 77.5920
  },
  "description": "What this zone monitors"
}
```

## Zone Types

- `entry_point` - Doors, gates, access points
- `emergency` - Panic buttons, hold-up alarms
- `fire` - Fire detection systems
- `panic` - Panic alarms
- `maintenance` - Tamper/trouble alerts
- `restoral` - System restore signals
- `access_control` - Card readers, badge systems

## Finding Coordinates

### Method 1: Google Maps
1. Right-click on a location in Google Maps
2. Click the coordinates to copy them
3. Format: First number is latitude, second is longitude

### Method 2: OpenStreetMap
1. Go to https://www.openstreetmap.org
2. Search for your location
3. Right-click and select "Show address"
4. Coordinates appear in the URL

### Bangalore Reference Points
- Vijayanagar: 12.9750, 77.5920
- Malleshwaram: 12.9730, 77.5965
- Rajajinagar: 12.9760, 77.5900
- Yeshwanthpur: 12.9770, 77.5970
- Electronics City: 12.8456, 77.6603
- Whitefield: 12.9698, 77.7500

## Map Settings

You can adjust the default map view in the `mapSettings` section:

```json
"mapSettings": {
  "defaultZoom": 13,     // Initial zoom level (10-18)
  "minZoom": 10,         // Minimum zoom out
  "maxZoom": 18,         // Maximum zoom in
  "defaultCenter": {     // Initial map center
    "lat": 12.9716,
    "lng": 77.5946
  }
}
```

## Event Type Configuration

Customize how different event codes appear:

```json
"eventTypes": {
  "BA": {
    "name": "Burglary Alarm",
    "priority": "high",
    "color": "#ef4444",
    "icon": "alert-triangle"
  }
}
```

## Testing Your Changes

After editing the file:

1. Save the file
2. Refresh your browser (Ctrl+R / Cmd+R)
3. Navigate to the Dashboard
4. The map should reflect your changes
5. Check browser console for any JSON syntax errors

## Common Issues

### Map doesn't update
- Check for JSON syntax errors (missing commas, brackets)
- Clear browser cache
- Restart the development server

### Markers don't appear
- Verify coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
- Ensure account numbers and zone IDs match exactly with incoming alerts
- Check console for error messages

### Wrong location
- Double-check latitude and longitude order (lat first, lng second)
- Verify coordinates using Google Maps or OpenStreetMap

## Backup

Before making major changes, create a backup:
```bash
cp location-mapping.json location-mapping.backup.json
```

## Integration with Alerts

When a SIA DC-09 alert comes in:
- Account number (e.g., "3333") is matched to an account
- Zone/event code (e.g., "BA0008") is matched to a zone
- Alert appears on the map at that zone's coordinates
- A pulsing circle indicates active alerts
- Color indicates priority level

## Example: Complete New Account

```json
"5555": {
  "name": "Bosch Factory - Bidadi",
  "city": "Bangalore",
  "state": "Karnataka",
  "country": "India",
  "centerCoordinates": {
    "lat": 12.8000,
    "lng": 77.5000
  },
  "zones": {
    "PA0001": {
      "name": "Main Gate Panic Button",
      "type": "panic",
      "location": "Factory Main Entrance",
      "coordinates": {
        "lat": 12.8010,
        "lng": 77.5010
      },
      "description": "Emergency panic button at main security gate"
    },
    "FA0002": {
      "name": "Warehouse Fire Detector",
      "type": "fire",
      "location": "Warehouse Building A",
      "coordinates": {
        "lat": 12.7990,
        "lng": 77.4995
      },
      "description": "Smoke and heat detection system"
    }
  }
}
```

## Support

For questions or issues with the location mapping, check:
- JSON syntax validator: https://jsonlint.com
- Coordinate finder: https://www.latlong.net
- Project documentation in the main README.md
