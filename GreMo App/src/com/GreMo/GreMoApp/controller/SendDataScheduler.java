package com.GreMo.GreMoApp.controller;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.GreMo.GreMoApp.Global;
import com.GreMo.GreMoApp.model.HTTPResult;
import com.GreMo.GreMoApp.model.TransmissionData;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

/**
 * SendDataScheduler that schedules the sending process
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class SendDataScheduler implements HTTPResult.Observer, HTTPResult.Provider {
    private final ArrayList<HTTPResult.Observer> observers = new ArrayList<HTTPResult.Observer>();

    private boolean currentlyScheduling = false;
    private boolean currentlyInProgress = false;

    private static final int IMMEDIATELY = 1;
    private static final int WAITING_IN_SECONDS = 5;
    private final DatabaseController dbController = DatabaseController.getInstance();

    private Intent intent;
    private AlarmManager alarmManager;
    private PendingIntent pendingIntent;

    private SendDataScheduler() {
    }

    private static SendDataScheduler instance;

    public static SendDataScheduler getInstance() {
        if (SendDataScheduler.instance == null) {
            SendDataScheduler.instance = new SendDataScheduler();
        }
        return SendDataScheduler.instance;
    }

    /**
     * enables the scheduling
     */
    public void enable() {
        this.currentlyScheduling = true;
        scheduleIn(IMMEDIATELY);
    }

    /**
     * send data once
     */
    public void sendOnce() {
        scheduleIn(IMMEDIATELY);
    }

    /**
     * disables the scheduling
     */
    public void disable() {
        this.currentlyScheduling = false;
    }

    /**
     * starts the scheduling in a specific abount of seconds
     *
     * @param seconds the time the sending starts in seconds
     */
    private void scheduleIn(int seconds) {
        this.intent = new Intent(Global.getMainActivity(), SendDataAlarmReceiver.class);
        this.pendingIntent = PendingIntent.getBroadcast(Global.getMainActivity(),
                0,
                this.intent,
                PendingIntent.FLAG_CANCEL_CURRENT);
        Calendar time = Calendar.getInstance();
        time.setTimeInMillis(System.currentTimeMillis());
        time.add(Calendar.SECOND, seconds);

        this.alarmManager = (AlarmManager) Global.getMainActivity()
                .getSystemService(Global.getMainActivity().ALARM_SERVICE);
        this.alarmManager.set(AlarmManager.RTC_WAKEUP, time.getTimeInMillis(), pendingIntent);
    }

    /**
     * is called when an http result returns and handles the further scheduling according to the http result
     *
     * @param result the returning http result
     */
    @Override
    public void onHTTPResultUpdate(HTTPResult result) {
        SendDataScheduler.getInstance().currentlyInProgress = false;

        /*
         * If result is success:
         * - delete oldest entry from DB
         * - start sending task immediately
         */

        if (result.isSuccess() || result.isBadRequest()) {
            List<Integer> ids = result.getRequest().getIds();
            for (Integer id : ids) {
                dbController.deleteData(id);
            }
            this.scheduleIn(IMMEDIATELY);

            /**
             * If result is NOT success:
             * - start scheduling in the set amount of seconds
             */

        } else {
            if (this.currentlyScheduling) {
                this.scheduleIn(WAITING_IN_SECONDS);
            }
        }

        this.notifyHTTPResultObservers(result);
    }

    @Override
    public void registerHTTPResultObserver(HTTPResult.Observer observer) {
        this.observers.add(observer);
    }

    @Override
    public void removeHTTPResultObserver(HTTPResult.Observer observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyHTTPResultObservers(HTTPResult data) {
        for (HTTPResult.Observer observer : this.observers) {
            observer.onHTTPResultUpdate(data);
        }
    }

    public static class SendDataAlarmReceiver extends BroadcastReceiver {
        public SendDataAlarmReceiver() {
            super();
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            Log.d("SendDataAlarmReceiver", "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ SendDataAlarmReceiver");
            this.startTask();
        }

        private void startTask() {
            Log.d("startTask", "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ startTask");
            if (!SendDataScheduler.getInstance().currentlyInProgress) {
                SendDataScheduler.getInstance().currentlyInProgress = true;
                TransmissionData entryToSend = DatabaseController.getInstance().getOldestData();
                SendDataTask task;
                if (entryToSend != null
                        && (entryToSend.getPath().equals(TransmissionData.Interface.PUSH_GPS.replace(":userId", "" + Global.getUserId()))
                        || entryToSend.getPath().equals(TransmissionData.Interface.PUSH_WIFI.replace(":userId", "" + Global.getUserId()))
                        || entryToSend.getPath().equals(TransmissionData.Interface.PUSH_MOTION.replace(":userId", "" + Global.getUserId()))
                        || entryToSend.getPath().equals(TransmissionData.Interface.PUSH_BLUETOOTH_DATA.replace(":userId", "" + Global.getUserId())))) {
                    // Bulkable transmission data
                    task = new SendDataTask(DatabaseController.getInstance().getBulk(entryToSend));
                } else {
                    task = new SendDataTask(entryToSend);
                }
                task.registerHTTPResultObserver(SendDataScheduler.getInstance());
                task.execute();
            }
        }
    }
}
