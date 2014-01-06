package com.GreMo.GreMoApp.model;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import com.GreMo.GreMoApp.Global;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Jens on 19.05.13.
 */
public class BluetoothSensor extends GremoSensor implements BluetoothData.Provider {
    private static BluetoothSensor instance;
    private final IntentFilter intentFilter;
    private final BluetoothAdapter bluetoothAdapter;
    private ArrayList<BluetoothData.Observer> observers = new ArrayList<BluetoothData.Observer>();
    private BroadcastReceiver broadcastReceiver;
    private List<BluetoothData.BluetoothScan> deviceList = new ArrayList<BluetoothData.BluetoothScan>();
    private boolean continuous = false;
    private long lastHeartbeat = System.currentTimeMillis();
    private final long HEARTBEAT_INTERVAL = 1000 * 60 * 15; // 15 Minutes

    private BluetoothSensor() {
        this.bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        this.intentFilter = new IntentFilter();
        this.intentFilter.addAction(BluetoothDevice.ACTION_FOUND);
        this.intentFilter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        this.intentFilter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);

        this.broadcastReceiver = new BroadcastReceiver() {
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();

                // When discovery finds a device
                if (action != null) {
                    if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
                        if (bluetoothAdapter.getState() == BluetoothAdapter.STATE_ON) {
                            BluetoothSensor.this.sense();
                        }
                    } else if (action.equals(BluetoothDevice.ACTION_FOUND)) {
                        BluetoothDevice foundDevice = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                        BluetoothSensor.this.deviceList.add(new BluetoothData.BluetoothScan(foundDevice));
                    } else if (action.equals(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)) {
                        long currentTime = System.currentTimeMillis();
                        if (deviceList.size() > 0 || currentTime - lastHeartbeat > HEARTBEAT_INTERVAL) {
                            lastHeartbeat = currentTime;
                            BluetoothSensor.this.notifyBluetoothDataObservers(new BluetoothData(deviceList));
                        }
                        BluetoothSensor.this.deviceList.clear();

                        if (BluetoothSensor.this.continuous) {
                            BluetoothSensor.this.sense();
                        } else {
                            BluetoothSensor.this.bluetoothAdapter.disable();
                            Global.getMainActivity().unregisterReceiver(this);
                        }
                    }
                }
            }
        };
    }

    public static BluetoothSensor getInstance() {
        if (BluetoothSensor.instance == null) {
            BluetoothSensor.instance = new BluetoothSensor();
        }
        return BluetoothSensor.instance;
    }

    @Override
    public void enable() throws BluetoothEnableException {
        if (this.bluetoothAdapter == null) {
            throw new BluetoothEnableException("No bluetooth support");
        }

        this.continuous = true;

        Global.getMainActivity().registerReceiver(this.broadcastReceiver, this.intentFilter);

        if (!this.bluetoothAdapter.isEnabled()) {
            this.bluetoothAdapter.enable();
        } else {
            this.sense();
        }
    }

    @Override
    public void disable() {
        this.continuous = false;
    }

    private void sense() {
        this.bluetoothAdapter.startDiscovery();
    }

    @Override
    public void senseOnce() {
        this.continuous = false;
        Global.getMainActivity().registerReceiver(this.broadcastReceiver, intentFilter);
        sense();
    }

    @Override
    public void registerBluetoothDataObserver(BluetoothData.Observer observer) {
        this.observers.add(observer);
    }

    @Override
    public void removeBluetoothDataObserver(BluetoothData.Observer observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyBluetoothDataObservers(BluetoothData data) {
        for (BluetoothData.Observer observer : this.observers) {
            observer.onBluetoothDataUpdate(data);
        }
    }

    public class BluetoothEnableException extends DeviceEnableException {
        public BluetoothEnableException(String message) {
            super(message);
        }
    }
}