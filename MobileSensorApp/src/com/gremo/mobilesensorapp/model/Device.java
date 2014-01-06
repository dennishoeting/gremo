package com.gremo.mobilesensorapp.model;

import com.google.android.gms.maps.model.LatLng;

/**
 * Created by DennisHoeting on 25.06.13.
 */
public abstract class Device {
    protected LatLng position;
    protected Device() { }

    public void setPosition(LatLng position) {
        this.position = position;
    }

    public abstract void enable() throws DeviceEnableException;
    public abstract void disable() throws DeviceDisableException;

    public class DeviceEnableException extends Exception {
        public DeviceEnableException(String msg) {
            super(msg);
        }
    }
    public class DeviceDisableException extends Exception {
        public DeviceDisableException(String msg) {
            super(msg);
        }
    }
}
