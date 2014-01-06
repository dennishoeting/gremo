package com.GreMo.GreMoApp.model;

import android.location.Location;

/**
 * @author Jens Runge
 * @version 1.0, 26.06.13
 */
public class LocationData extends GenericData<Location> {
    public LocationData(Location location) {
        super(location);
    }

    public interface Observer {
        public void onLocationUpdate(LocationData data);
    }

    public interface Provider {
        public void registerLocationObserver(Observer observer);

        public void removeLocationObserver(Observer observer);

        public void notifyLocationObservers(LocationData data);
    }
}
