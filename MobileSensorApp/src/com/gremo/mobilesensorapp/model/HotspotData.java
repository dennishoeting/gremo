package com.gremo.mobilesensorapp.model;

/**
 * Created by Jens Runge on 26.06.13.
 */
public class HotspotData extends GenericData<Boolean> {
    public HotspotData(Boolean data) {
        super(true);
    }

    public interface Observer {
        public void onHotspotDataUpdate(HotspotData data);
    }

    public interface Provider {
        public void registerHotspotDataObserver(Observer observer);

        public void removeHotspotDataObserver(Observer observer);

        public void notifyHotspotDataObservers(HotspotData data);
    }
}
