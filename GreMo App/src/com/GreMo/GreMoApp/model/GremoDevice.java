package com.GreMo.GreMoApp.model;

import com.google.android.gms.maps.model.LatLng;

/**
 * @author DennisHoeting
 * @version 1.0, 25.06.13
 */
abstract class GremoDevice {
    private LatLng position;

    GremoDevice() {
    }

    public void setPosition(LatLng position) {
        this.position = position;
    }

    public abstract void enable() throws LocationSensor.NoGPSException, LocationSensor.NoNetLocException, BluetoothSensor.BluetoothEnableException;

    public abstract void disable() throws DeviceDisableException;

    public class DeviceEnableException extends Exception {
        public DeviceEnableException(String msg) {
            super(msg);
        }
    }

    private class DeviceDisableException extends Exception {
        public DeviceDisableException(String msg) {
            super(msg);
        }
    }
}
