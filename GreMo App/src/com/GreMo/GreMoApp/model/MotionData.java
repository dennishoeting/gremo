package com.GreMo.GreMoApp.model;

import android.hardware.SensorEvent;

/**
 * @author Jens Runge
 * @version 1.0, 08.07.13
 */
public class MotionData extends GenericData<SensorEvent> {
    public MotionData(SensorEvent data) {
        super(data);
    }

    public interface Observer {
        public void onMotionDataUpdate(MotionData data);
    }

    public interface Provider {
        public void registerMotionDataObserver(Observer observer);

        public void removeMotionDataObserver(Observer observer);

        public void notifyMotionDataObservers(MotionData data);
    }
}
