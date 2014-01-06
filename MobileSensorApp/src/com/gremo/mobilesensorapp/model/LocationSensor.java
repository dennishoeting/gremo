package com.gremo.mobilesensorapp.model;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;

import com.gremo.mobilesensorapp.Global;

import java.util.ArrayList;

/**
 * Singleton GPS Sensor
 */
public class LocationSensor extends Sensor implements LocationListener, LocationData.Provider {
    /*
     * Constants
     */
    private static final long MIN_DISTANCE_CHANGE_FOR_UPDATES = 0;  //10; // 10 meter
    private static final long MIN_TIME_BW_UPDATES = 5000;  //1000 * 60 * 1; // 1 minute
    private static final int SENCE_COUNTER_VALUE = 2;
    /**
     * Return singleton instance
     */
    private static LocationSensor instance;
    /*
     * Observers
     */
    private ArrayList<LocationData.Observer> observers = new ArrayList<LocationData.Observer>();
    /*
     * Location Manager
     */
    private LocationManager locationManager;
    /*
     * current location
     */
    private Location location;
    private boolean enabled;
    private int senseCounter;

    // Constructor
    private LocationSensor() {
        super();

        this.enabled = false;
    }

    public static LocationSensor getInstance() {
        if (LocationSensor.instance == null) {
            LocationSensor.instance = new LocationSensor();
        }
        return LocationSensor.instance;
    }

    /**
     * Enable sensor
     */
    @Override
    public void enable() {
        if (this.enabled) {
            return;
        }
        this.enabled = true;

        try {
            // get location manager
            this.locationManager = (LocationManager) Global.getMainActivity().getSystemService(Context.LOCATION_SERVICE);

            boolean systemGPSEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            boolean systemNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);

            if (systemNetworkEnabled) {
                this.locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,
                        MIN_TIME_BW_UPDATES,
                        MIN_DISTANCE_CHANGE_FOR_UPDATES,
                        this);
            }

            if (systemGPSEnabled) {
                this.locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER,
                        MIN_TIME_BW_UPDATES,
                        MIN_DISTANCE_CHANGE_FOR_UPDATES,
                        this);
            }

        } catch (Exception e) {
            this.getNoLocationAlert().show();
            this.enabled = false;
        }
    }

    /**
     * Ask for updates
     */
    @Override
    public void senseOnce() {
        if (this.enabled) {
            return;
        }
        this.enable();
        this.senseCounter = SENCE_COUNTER_VALUE;
    }

    /**
     * Disable sensor
     */
    @Override
    public void disable() {
        if (!this.enabled) {
            return;
        }
        this.enabled = false;

        if (this.locationManager != null) {
            this.locationManager.removeUpdates(this);
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        if (senseCounter > 0) {
            senseCounter--;
        } else {
            this.disable();
            return;
        }
        this.location = location;
        this.notifyLocationObservers(new LocationData(this.location));
    }

    @Override
    public void onProviderDisabled(String provider) {
    }

    @Override
    public void onProviderEnabled(String provider) {
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        locationManager.removeUpdates(this);
    }

    @Override
    public void registerLocationObserver(LocationData.Observer observer) {
        this.observers.add(observer);
    }

    @Override
    public void removeLocationObserver(LocationData.Observer observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyLocationObservers(LocationData location) {
        for (LocationData.Observer observer : this.observers) {
            observer.onLocationUpdate(location);
        }
    }

    /**
     * if gps is turned off this dialog will be called to ask the user turning
     * it on, it forwards the user to the system location settings
     */
    private AlertDialog getNoLocationAlert() {
        final AlertDialog.Builder builder = new AlertDialog.Builder(Global.getMainActivity());
        builder.setMessage(
                "Your GPS seems to be disabled, do you want to enable it?")
                .setCancelable(false)
                .setPositiveButton("Yes",
                        new DialogInterface.OnClickListener() {
                            public void onClick(final DialogInterface dialog,
                                                final int id) {
                                Global.getMainActivity().startActivity(new Intent(
                                        android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS));
                            }
                        })
                .setNegativeButton("No", new DialogInterface.OnClickListener() {
                    public void onClick(final DialogInterface dialog,
                                        final int id) {
                        dialog.cancel();
                    }
                });
        return builder.create();
    }
}