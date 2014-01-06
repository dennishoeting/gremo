package com.GreMo.GreMoApp.model;

import android.content.Context;
import android.content.SharedPreferences;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.text.format.Time;
import android.util.Log;

import com.GreMo.GreMoApp.Global;

import java.util.ArrayList;

/**
 * LocationSensor that handles the tracking of the device via gps
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class LocationSensor extends GremoSensor implements LocationListener, LocationData.Provider {
    /*
     * Constants
     */
    private static final long MIN_DISTANCE_CHANGE_FOR_UPDATES = 5; // 5 meter
    private static final long MIN_TIME_BW_UPDATES = 1000 * 5; // 5 seconds
    /**
     * Return singleton instance
     */
    private static LocationSensor instance;
    /*
         * Observers
         */
    private final ArrayList<LocationData.Observer> observers = new ArrayList<LocationData.Observer>();
    /*
     * Location Manager
     */
    private LocationManager locationManager;
    /*
     * current location
     */
    private Location location;
    private boolean enabled;
    private SharedPreferences.Editor userDetailsEdit;
    private SharedPreferences userDetails;
    private SharedPreferences deafaultPreferences;

    /**
     * Constructor
     */
    private LocationSensor() {
        this.enabled = false;
        this.deafaultPreferences = PreferenceManager.getDefaultSharedPreferences(Global.getMainActivity());
    }

    public static LocationSensor getInstance() {
        if (LocationSensor.instance == null) {
            LocationSensor.instance = new LocationSensor();
        }
        return LocationSensor.instance;
    }

    @Override
    public void enable() throws NoGPSException, NoNetLocException {
        if (this.enabled) {
            return;
        }
        this.locationManager = (LocationManager) Global.getMainActivity().getSystemService(Context.LOCATION_SERVICE);
        //TODO: einen dritte Exception, falls beides aus ist
        if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) && this.deafaultPreferences.getBoolean("gps_switch", false)) {
            throw new NoGPSException();
        }
        if (!locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) && this.deafaultPreferences.getBoolean("net_switch", false)) {
            throw new NoNetLocException();
        }
        // get location manager


        if (this.deafaultPreferences.getBoolean("net_switch", true) && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
            this.locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,
                    MIN_TIME_BW_UPDATES,
                    MIN_DISTANCE_CHANGE_FOR_UPDATES,
                    this);
        }

        if (this.deafaultPreferences.getBoolean("gps_switch", true) && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            this.locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER,
                    MIN_TIME_BW_UPDATES,
                    MIN_DISTANCE_CHANGE_FOR_UPDATES,
                    this);
        }
        this.enabled = true;
    }

    @Override
    public void senseOnce() {
        // Give last location
        this.notifyLocationObservers(new LocationData(this.location));
    }

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
        // Get instance of Vibrator from current Context
//        Vibrator v = (Vibrator) Global.getMainActivity().getSystemService(Context.VIBRATOR_SERVICE);
//
//        // Vibrate for 300 milliseconds
//        v.vibrate(300);

        if (location.getProvider().equals("gps")) {
            Time now = new Time();
            now.setToNow();
            long offset = now.toMillis(false) - location.getTime(); //offset bewtween gps time and system time in milliseconds
            this.userDetails = Global.getMainActivity().getSharedPreferences("userdetails", 0);
            this.userDetailsEdit = userDetails.edit();
            this.userDetailsEdit.putLong("offset", offset);
            this.userDetailsEdit.commit();
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

        Log.d("onStatusChanged *******************************************", "########################################### onStatusChanged " + provider);
        switch (status) {
            case LocationProvider.AVAILABLE:

                break;
            case LocationProvider.OUT_OF_SERVICE:

                break;
            case LocationProvider.TEMPORARILY_UNAVAILABLE:

                break;
        }
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
    public void notifyLocationObservers(LocationData data) {
        for (LocationData.Observer observer : this.observers) {
            observer.onLocationUpdate(data);
        }
    }

    public class NoGPSException extends Exception {
        public NoGPSException() {
            super("No gps available");
        }
    }

    public class NoNetLocException extends Exception {
        public NoNetLocException() {
            super("No net location available");
        }
    }
}