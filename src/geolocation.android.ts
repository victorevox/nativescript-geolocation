import * as app from "tns-core-modules/application";

import {
    android as androidAppInstance,
    AndroidApplication,
    AndroidActivityResultEventData,
    AndroidActivityRequestPermissionsEventData
} from "application";
import { device as PlatformDevice } from "platform";
import { Accuracy } from "ui/enums";
import { setTimeout, clearTimeout } from "timer";
import { write } from "trace";
import {
    LocationBase,
    defaultGetLocationTimeout,
    minTimeUpdate,
    minRangeUpdate
} from "./geolocation.common";
import {
    LocationMonitor as LocationMonitorDef,
    Options,
    successCallbackType,
    errorCallbackType
} from "./location-monitor";

import * as permissions from "nativescript-permissions";

let context = app.android.context;
declare var com:any;
let LocationServices = com.google.android.gms.location.LocationServices;
let FusedLocationProviderClient = com.google.android.gms.location.FusedLocationProviderClient;
let OnCompleteListener = com.google.android.gms.tasks.OnCompleteListener;
let Task = com.google.android.gms.tasks.Task;

export class CustomLocation extends LocationBase {
    public android: android.location.Location;  // android Location
}   

class FusedLocationManager {

    private googleApiClient;
    private lastKnownLocation: CustomLocation;
    private fusedLocationProviderClient = null;

    public hasPermissions() : boolean {
        return permissions.hasPermission((<any>android).Manifest.permission.ACCESS_FINE_LOCATION);
    }

    private requestPermissions() : any{
        if(this.hasPermissions()){
            return Promise.resolve();
        }

        if ((<any>android).os.Build.VERSION.SDK_INT >= 23) {
            return permissions.requestPermission((<any>android).Manifest.permission.ACCESS_FINE_LOCATION);
        } else {
            return Promise.resolve();
        }
    }

    private getClient() {
        if(this.fusedLocationProviderClient == null){
            this.fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context);
        }  
        console.log(this.fusedLocationProviderClient);

        return this.fusedLocationProviderClient;
    }

    public getLastLocation() : Promise <CustomLocation> {
        var that = this;

        return new Promise<CustomLocation>(function(resolve, reject){
            that.requestPermissions()
            .then(function(){
                let client = that.getClient();
                client.getLastLocation()
                    .addOnCompleteListener(context, new OnCompleteListener({
                        onComplete: function(androidLocation){
                            console.log(androidLocation);
                            var location = that.locationFromAndroidLocation(androidLocation);

                            if (!location) {
                                reject("Error while getting last location");
                            }

                            that.lastKnownLocation = location
                            console.log(JSON.stringify(location));
                            resolve(location);
                        }
                    }));
            })
            .catch(function() {
                console.log("error")
            })
        });
    }

    private locationFromAndroidLocation(androidLocation: android.location.Location): CustomLocation {
        console.log(`Converting androidLocation to location with date ${androidLocation.getTime()}`);
        if(androidLocation){
            let location = new CustomLocation();
            location.latitude = androidLocation.getLatitude();
            location.longitude = androidLocation.getLongitude();
            location.altitude = androidLocation.getAltitude();
            location.horizontalAccuracy = androidLocation.getAccuracy();
            location.verticalAccuracy = androidLocation.getAccuracy();
            location.speed = androidLocation.getSpeed();
            location.direction = androidLocation.getBearing();
            location.timestamp = new Date(androidLocation.getTime());
            location.android = androidLocation;
            return location;
        }

        console.log("locationFromAndroidLocation :: No android location provided");
        return null;
        
    }

    private androidLocationFromLocation(location: CustomLocation): android.location.Location {
        let androidLocation = new android.location.Location("custom");
        androidLocation.setLatitude(location.latitude);
        androidLocation.setLongitude(location.longitude);
        if (location.altitude) {
            androidLocation.setAltitude(location.altitude);
        }
        if (location.speed) {
            androidLocation.setSpeed(float(location.speed));
        }
        if (location.direction) {
            androidLocation.setBearing(float(location.direction));
        }
        if (location.timestamp) {
            try {
                androidLocation.setTime(long(location.timestamp.getTime()));
            } catch (e) {
                console.error("invalid location timestamp");
            }
        }
        return androidLocation;
    }
}

let fusedLocationManager = new FusedLocationManager();

export function getCurrentLocation(options: Options): Promise<CustomLocation> {
    return fusedLocationManager.getLastLocation();
}

export function isEnabled(){
    return fusedLocationManager.hasPermissions();
}