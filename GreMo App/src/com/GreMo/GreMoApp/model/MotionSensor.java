package com.GreMo.GreMoApp.model;


import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.GreMo.GreMoApp.Global;

import java.util.ArrayList;

public class MotionSensor extends GremoSensor implements SensorEventListener, MotionData.Provider {
    // Value, how many times the motionsensor values have to be higher then g
    private final static double MOTION_TRESHOLD = 2;
    // minimal time betwen two motionsensor values
    private final static double TIME_TRESHOLD = 200;
    private static MotionSensor instance;
    private final ArrayList<MotionData.Observer> observers = new ArrayList<MotionData.Observer>();
    private Sensor accelerometer;
    private SensorManager sensorManager;
    private boolean enabled;
    private long lastUpdate;

    public MotionSensor() {
        sensorManager = (SensorManager) Global.getMainActivity().getSystemService(Context.SENSOR_SERVICE);
        this.enabled = false;
    }

    public static MotionSensor getInstance() {
        if (MotionSensor.instance == null) {
            MotionSensor.instance = new MotionSensor();
        }
        return MotionSensor.instance;
    }

    @Override
    public void enable() {
        if (this.enabled) {
            return;
        }
        this.enabled = true;
        this.accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        this.sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
    }

    @Override
    public void disable() {
        if (!this.enabled) {
            return;
        }
        this.enabled = false;

        if (this.sensorManager != null) {
            this.sensorManager.unregisterListener(this);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            getAccelerometer(event);
        }

    }

    private void getAccelerometer(SensorEvent event) {
        float[] values = event.values;
        // movement
        float x = values[0];
        float y = values[1];
        float z = values[2];

        double accelationSquareRoot = (x * x + y * y + z * z)
                / (SensorManager.GRAVITY_EARTH * SensorManager.GRAVITY_EARTH);
        long actualTime = System.currentTimeMillis();
        if (accelationSquareRoot >= MOTION_TRESHOLD) {
            if (actualTime - this.lastUpdate > TIME_TRESHOLD) {
                this.lastUpdate = actualTime;
                this.notifyMotionDataObservers(new MotionData(event));
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    @Override
    public void senseOnce() {
    }

    @Override
    public void registerMotionDataObserver(MotionData.Observer observer) {
        observers.add(observer);
    }

    @Override
    public void removeMotionDataObserver(MotionData.Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyMotionDataObservers(MotionData data) {
        for (MotionData.Observer observer : observers) {
            observer.onMotionDataUpdate(data);
        }
    }
}