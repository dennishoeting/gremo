package com.gremo.mobilesensorapp.model;

import java.util.HashMap;

/**
 * Created by Jens Runge on 26.06.13.
 */
public class WifiData extends GenericData<HashMap<String, String>> {
    public WifiData(HashMap<String, String> data) {
        super(data);
    }

    public interface Observer {
        public void onWifiDataUpdate(WifiData data);
    }

    public interface Provider {
        public void registerWifiDataObserver(Observer observer);
        public void removeWifiDataObserver(Observer observer);
        public void notifyWifiDataObservers(WifiData data);
    }
}
