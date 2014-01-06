package com.gremo.mobilesensorapp.controller;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.gremo.mobilesensorapp.Global;
import com.gremo.mobilesensorapp.model.HTTPResult;
import com.gremo.mobilesensorapp.model.TransmissionData;

import java.util.Calendar;
import java.util.List;

/**
 * Created by Jens on 22.05.13.
 */
public class SendDataScheduler implements HTTPResult.Observer {
    private static final int IMMEDIATELY = 1;
    private static final int WAITING_IN_SECONDS = 30;
    private static SendDataScheduler instance;
    private boolean currentlyScheduling = false;
    private boolean currentlyInProgress = false;
    private DatabaseController dbController = DatabaseController.getInstance();

    private SendDataScheduler() {
    }

    public static SendDataScheduler getInstance() {
        if (SendDataScheduler.instance == null) {
            SendDataScheduler.instance = new SendDataScheduler();
        }
        return SendDataScheduler.instance;
    }

    public void enable() {
        this.currentlyScheduling = true;
        scheduleIn(IMMEDIATELY);
    }

    public void sendOnce() {
        scheduleIn(IMMEDIATELY);
    }

    public void disable() {
        this.currentlyScheduling = false;
    }

    private void scheduleIn(int seconds) {
        Intent intent = new Intent(Global.getMainActivity(), SendDataAlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(Global.getMainActivity(),
                0,
                intent,
                PendingIntent.FLAG_CANCEL_CURRENT);
        Calendar time = Calendar.getInstance();
        time.setTimeInMillis(System.currentTimeMillis());
        time.add(Calendar.SECOND, seconds);

        AlarmManager alarmManager = (AlarmManager) Global.getMainActivity()
                .getSystemService(Context.ALARM_SERVICE);
        alarmManager.set(AlarmManager.RTC_WAKEUP, time.getTimeInMillis(), pendingIntent);
    }

    @Override
    public void onHTTPResultUpdate(HTTPResult result) {
        SendDataScheduler.getInstance().currentlyInProgress = false;

        /*
         * If result is success:
         * - delete oldest entry from DB
         * - start sending task immediately
         */
        if (result.isSuccess() || result.isBadRequest()) {
            Log.d("++++++++++++++++++++++++++++++++++ , onHTTPResultUpdate", "" + result.getRequest().getIds().size());
            result.getRequest().getIds();
            List<Integer> ids = result.getRequest().getIds();
            for (int i = 0; i < ids.size(); i++) {

                dbController.deleteData(ids.get(i));
            }
            this.scheduleIn(IMMEDIATELY);
        } else {
            if (this.currentlyScheduling) {
                this.scheduleIn(WAITING_IN_SECONDS);
            }
        }
    }

    public static class SendDataAlarmReceiver extends BroadcastReceiver {
        public SendDataAlarmReceiver() {
            super();
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            this.startTask();
        }

        private void startTask() {
            if (!SendDataScheduler.getInstance().currentlyInProgress) {
                SendDataScheduler.getInstance().currentlyInProgress = true;

                TransmissionData entryToSend = DatabaseController.getInstance().getOldestData();
                SendDataTask task = null;
                if (entryToSend != null
                        && (entryToSend.getPath().equals(TransmissionData.Interface.PUSH_BLUETOOTH_DATA + Global.getMacAddress())
                        || entryToSend.getPath().equals(TransmissionData.Interface.ADD_WIFI))) {
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
