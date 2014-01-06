package com.gremo.mobilesensorapp.model;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiManager;
import android.util.Log;

import com.gremo.mobilesensorapp.Global;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Created by Jens on 19.05.13.
 */
public class WifiSensor extends Sensor implements WifiData.Provider {
    private static final String SSID = "SSID";
    private static final String BSSID = "BSSID";
    /*
     * get instance
     */
    private static WifiSensor instance;
    /*
     * WifiManager
     */
    private final WifiManager wifiManager;
    /*
     * Observers
     */
    private ArrayList<WifiData.Observer> observers = new ArrayList<WifiData.Observer>();
    private BroadcastReceiver broadcastReceiver;
    private List<ScanResult> results;
    private boolean continuous = false;

    /*
     * Constructor
     */
    private WifiSensor() {
        this.wifiManager = (WifiManager) Global.getMainActivity().getSystemService(Context.WIFI_SERVICE);
        this.wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL, "Gremo WiFi Lock");
        this.broadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent intent) {
                WifiSensor.this.results = wifiManager.getScanResults();
                int size = results.size();

                // BroadcastReceiver is getting invoked now...
                while (size > 0) {
                    size--;
                    HashMap<String, String> map = new HashMap<String, String>();
                    if (results.get(size).SSID.equals("")) {
                        map.put(SSID, "unknown network");
                    } else {
                        map.put(SSID, results.get(size).SSID);
                    }
                    map.put(BSSID, results.get(size).BSSID);
                    Log.d("WifiSensor.onReceive", "putting: " + results.get(size).SSID);
                    WifiSensor.this.notifyWifiDataObservers(new WifiData(map));
                }

                if (WifiSensor.this.continuous) {
                    sense();
                } else {
                    Global.getMainActivity().unregisterReceiver(WifiSensor.this.broadcastReceiver);
                }
            }
        };
    }

    public static WifiSensor getInstance() {
        if (WifiSensor.instance == null) {
            WifiSensor.instance = new WifiSensor();
        }
        return WifiSensor.instance;
    }

    @Override
    public void enable() {
        this.continuous = true;

        Global.getMainActivity().registerReceiver(broadcastReceiver, new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION));

        // Sense
        this.sense();
    }

    private void sense() {
        if (!wifiManager.isWifiEnabled()) {
            wifiManager.setWifiEnabled(true);
        }

        wifiManager.startScan();
    }

    @Override
    public void senseOnce() {
        this.continuous = false;

        Global.getMainActivity().registerReceiver(broadcastReceiver, new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION));

        // Sense
        this.sense();
    }

    @Override
    public void disable() {
        this.continuous = false;
    }

    @Override
    public void registerWifiDataObserver(WifiData.Observer observer) {
        observers.add(observer);
    }

    @Override
    public void removeWifiDataObserver(WifiData.Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyWifiDataObservers(WifiData data) {

        for (WifiData.Observer observer : observers) {
            observer.onWifiDataUpdate(data);
        }
    }
}

