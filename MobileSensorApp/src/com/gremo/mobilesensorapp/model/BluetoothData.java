package com.gremo.mobilesensorapp.model;

import android.bluetooth.BluetoothDevice;

import java.util.Calendar;
import java.util.List;

/**
 * Created by Jens Runge on 26.06.13.
 */
public class BluetoothData extends GenericData<List<BluetoothData.BluetoothScan>> {
    public BluetoothData(List<BluetoothData.BluetoothScan> data) {
        super(data);
    }

    public static class BluetoothScan {
        private BluetoothDevice device;
        private Calendar time = Calendar.getInstance();

        public BluetoothScan(BluetoothDevice device) {
            this.time.setTimeInMillis(System.currentTimeMillis());
            this.device = device;
        }

        public Calendar getTime() {
            return this.time;
        }

        public BluetoothDevice getDevice() {
            return this.device;
        }
    }

    public interface Observer {
        public void onBluetoothDataUpdate(BluetoothData data);
    }

    public interface Provider {
        public void registerBluetoothDataObserver(Observer observer);

        public void removeBluetoothDataObserver(Observer observer);

        public void notifyBluetoothDataObservers(BluetoothData data);
    }
}
