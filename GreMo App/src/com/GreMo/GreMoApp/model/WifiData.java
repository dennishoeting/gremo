package com.GreMo.GreMoApp.model;

import java.util.Map;

/**
 * @author Jens Runge
 * @version 1.0, 26.06.13
 */
public class WifiData extends GenericData<Map<String, String>> {
    public WifiData(Map<String, String> data) {
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
