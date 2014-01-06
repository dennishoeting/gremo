package com.gremo.mobilesensorapp.model;

import android.content.Context;
import android.net.wifi.WifiManager;

import com.gremo.mobilesensorapp.Global;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;

/**
 * Created by Jens Runge on 25.06.13.
 */
public class Hotspot extends Device implements HotspotData.Provider {
    /*
     * Observers
     */
    private ArrayList<HotspotData.Observer> observers = new ArrayList<HotspotData.Observer>();

    /*
     * Wifi manager
     */
    private WifiManager wifiManager;

    /**
     * Constructor
     */
    private Hotspot() {
        this.wifiManager = (WifiManager) Global.getMainActivity().getSystemService(Context.WIFI_SERVICE);
    }

    private static Hotspot instance;

    public static Hotspot getInstance() {
        if (Hotspot.instance == null) {
            Hotspot.instance = new Hotspot();
        }
        return Hotspot.instance;
    }

    @Override
    public void enable() {
        try {
            wifiManager.setWifiEnabled(false);
            Method[] wmMethods = wifiManager.getClass().getDeclaredMethods();
            for (Method method : wmMethods) {
                if (method.getName().equals("setWifiApEnabled")) {
                    method.invoke(this.wifiManager, null, true);
                }
            }

            this.notifyHotspotDataObservers(new HotspotData(true));
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void disable() {
        try {
            Method[] wmMethods = wifiManager.getClass().getDeclaredMethods();
            for (Method method : wmMethods) {
                if (method.getName().equals("setWifiApEnabled")) {
                    method.invoke(this.wifiManager, null, false);
                }
            }
            wifiManager.setWifiEnabled(true);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void registerHotspotDataObserver(HotspotData.Observer observer) {
        this.observers.add(observer);
    }

    @Override
    public void removeHotspotDataObserver(HotspotData.Observer observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyHotspotDataObservers(HotspotData data) {
        for (HotspotData.Observer observer : observers) {
            observer.onHotspotDataUpdate(data);
        }
    }
}
