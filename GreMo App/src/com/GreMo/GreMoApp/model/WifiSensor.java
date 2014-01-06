package com.GreMo.GreMoApp.model;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiManager;

import com.GreMo.GreMoApp.Global;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;

/**
 * WifiSensor that handles the tracking of the device via WiFi
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class WifiSensor extends GremoSensor implements WifiData.Provider {
    private static final int INTERVAL = 5;
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
    private final ArrayList<WifiData.Observer> observers = new ArrayList<WifiData.Observer>();
    private BroadcastReceiver broadcastReceiver;
    private List<ScanResult> results;
    private boolean continuous = false;
    private Intent intent;
    private AlarmManager alarmManager;
    private PendingIntent pendingIntent;
    private boolean reciverRegistered;

    /*
     * Constructor
     */
    private WifiSensor() {
        this.wifiManager = (WifiManager) Global.getMainActivity().getSystemService(Global.getMainActivity().WIFI_SERVICE);
        this.reciverRegistered = false;
        this.broadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent intent) {
                WifiSensor.this.results = wifiManager.getScanResults();
                int size = results.size();

                // BroadcastReceiver is getting invoked now...

                if (size > 0) {
                    HashMap<String, String> stringStringHashMap = new HashMap<String, String>();
                    while (size > 0) {
                        size--;
                        stringStringHashMap.put(results.get(size).BSSID, results.get(size).SSID);
                    }
                    WifiSensor.this.notifyWifiDataObservers(new WifiData(stringStringHashMap));
                }

                if (WifiSensor.this.continuous) {
                    WifiSensor.this.schedule();
                } else {
                    WifiSensor.this.unregisterReciver();
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

        registerReciver();

        // Sense
        this.sense();
    }

    private void registerReciver() {

        Global.getMainActivity().registerReceiver(this.broadcastReceiver, new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION));
        this.reciverRegistered = true;
    }

    private void schedule() {
        this.intent = new Intent(Global.getMainActivity(), WifiSensorAlarmReceiver.class);
        this.pendingIntent = PendingIntent.getBroadcast(Global.getMainActivity(),
                0,
                this.intent,
                PendingIntent.FLAG_CANCEL_CURRENT);
        Calendar time = Calendar.getInstance();
        time.setTimeInMillis(System.currentTimeMillis());
        time.add(Calendar.SECOND, INTERVAL);

        this.alarmManager = (AlarmManager) Global.getMainActivity()
                .getSystemService(Global.getMainActivity().ALARM_SERVICE);
        this.alarmManager.set(AlarmManager.RTC_WAKEUP, time.getTimeInMillis(), this.pendingIntent);
    }

    @Override
    public void senseOnce() {
        this.continuous = false;

        registerReciver();

        // Sense
        this.schedule();
    }

    private void sense() {
        if (!WifiSensor.getInstance().wifiManager.isWifiEnabled()) {
            WifiSensor.getInstance().wifiManager.setWifiEnabled(true);
        }

        WifiSensor.getInstance().wifiManager.startScan();
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

    public void unregisterReciver() {
        if (WifiSensor.this.broadcastReceiver != null && Global.getMainActivity() != null && reciverRegistered) {
            Global.getMainActivity().unregisterReceiver(WifiSensor.this.broadcastReceiver);
            this.reciverRegistered = false;
        }
    }

    public static class WifiSensorAlarmReceiver extends BroadcastReceiver {
        public WifiSensorAlarmReceiver() {
            super();
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            WifiSensor.getInstance().sense();
        }
    }
}