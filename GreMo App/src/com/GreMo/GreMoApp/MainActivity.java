package com.GreMo.GreMoApp;

import android.app.AlertDialog;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.bluetooth.BluetoothAdapter;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;

import com.GreMo.GreMoApp.controller.DatabaseController;
import com.GreMo.GreMoApp.controller.GremoExceptionHandler;
import com.GreMo.GreMoApp.fragments.ActionFragment;
import com.GreMo.GreMoApp.fragments.HistoryFragment;
import com.GreMo.GreMoApp.fragments.ProfileFragment;
import com.google.analytics.tracking.android.EasyTracker;
import com.google.analytics.tracking.android.GoogleAnalytics;
import com.google.analytics.tracking.android.Tracker;

import java.util.Locale;

public class MainActivity extends FragmentActivity {
    boolean shouldNotify;
    private SectionsPagerAdapter mSectionsPagerAdapter;
    private ViewPager mViewPager;
    private Editor userDetailsEdit;
    private SharedPreferences userDetails;
    private DatabaseController databaseCtrl;
    private ActionFragment actionFragment;
    private ProfileFragment profileFragment;
    private HistoryFragment historyFragment;
    private Tracker mGaTracker;
    private GoogleAnalytics mGaInstance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Global.setMainActivity(this);
        this.mGaInstance = GoogleAnalytics.getInstance(Global.getMainActivity());
        this.mGaTracker = mGaInstance.getTracker("UA-43209279-1");

        Thread.setDefaultUncaughtExceptionHandler(new GremoExceptionHandler(this));
        setContentView(R.layout.activity_main);


        this.userDetails = getSharedPreferences("userdetails", 0);
        this.userDetailsEdit = userDetails.edit();
        Global.setUserId(userDetails.getInt("userId", 0));
        BluetoothAdapter mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (mBluetoothAdapter != null) {
            Global.setMacAddress(mBluetoothAdapter.getAddress());
        } else {
            Global.setMacAddress(null);
        }

        this.userDetailsEdit.putBoolean("notify", false);
        this.userDetailsEdit.commit();

        this.mSectionsPagerAdapter = new SectionsPagerAdapter(
                getSupportFragmentManager());
        this.mViewPager = (ViewPager) findViewById(R.id.pager);
        this.mViewPager.setAdapter(mSectionsPagerAdapter);
        this.mViewPager.setOffscreenPageLimit(3);

        this.databaseCtrl = DatabaseController.getInstance();

        this.actionFragment = new ActionFragment();
        this.actionFragment.registerDBEntryObserver(this.databaseCtrl);

        this.profileFragment = new ProfileFragment();
        this.historyFragment = new HistoryFragment();

    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main, menu);
        getMenuInflater().inflate(R.menu.actionbar, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.action_settings:
                Intent intent = new Intent(this, SettingsActivity.class);
                this.startActivityForResult(intent, 1);
                return true;
            case R.id.action_help:
                showHelpBox();
                return true;
            case R.id.action_logout:
                userDetailsEdit.clear();
                userDetailsEdit.commit();
                this.finish();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    private void showHelpBox() {
        AlertDialog.Builder alertbox = new AlertDialog.Builder(this);
        alertbox.setTitle(R.string.helpMessageTitle);
        alertbox.setMessage(R.string.helpMessage);

        alertbox.setPositiveButton(R.string.yes,
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                        String url = "http://alfsee.informatik.uni-oldenburg.de:1332/";
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                    }
                });

        alertbox.setNeutralButton(R.string.no,
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                    }
                });
        alertbox.show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
//        if (resultCode == RESULT_OK && requestCode == 1) {
//            if (data.hasExtra("loc")) {
//                //this.gpsTracker.locationManager.removeUpdates(this.gpsTracker);
//                //this.gpsTracker.start();
//            }
//            if (data.hasExtra("sendData")) {
//                //LocationSensor.setSendData(data.getBooleanExtra("sendData", false));
//            }
//        }
//        if (resultCode == RESULT_CANCELED && requestCode == 2) {
//            Log.d("TEST", "******************* " + resultCode + " *******************");
//            this.actionFragment.enableLocationAfterSettings();
//        }
    }

    @Override
    protected void onPause() {
        if (this.userDetails.getBoolean("notify", false)) {
            createNotification();
            MainActivity.this.mGaTracker.sendEvent("ui_action", "button_press", "home_button", 1L);
        } else {
            MainActivity.this.actionFragment.disableSending();
            MainActivity.this.mGaTracker.sendEvent("ui_action", "button_press", "home_button", 0L);
        }
        //this.actionFragment.wifiSensor.unregisterReciver();
        super.onPause();
    }

    @Override
    protected void onResume() {
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        notificationManager.cancel(0);
        super.onResume();
    }

    @Override
    public void onStart() {
        super.onStart();
        EasyTracker.getInstance().activityStart(this); // Add this method.
    }

    @Override
    protected void onStop() {
        super.onStop();
        EasyTracker.getInstance().activityStop(this);
    }

    @Override
    protected void onNewIntent(Intent intent) {
    }

    private void createNotification() {
        // Prepare intent which is triggered if the
        // notification is selected

        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("android.intent.action.MAIN");
        intent.addCategory("android.intent.category.LAUNCHER");
        // intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        // intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        intent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        PendingIntent pIntent = PendingIntent.getActivity(this, 0, intent, 0);

        // Build notification
        Notification notification = new Notification.Builder(this).setAutoCancel(true)
                .setContentTitle(this.getString(R.string.NotificationTitle))
                .setContentText(this.getString(R.string.app_name))
                .setSmallIcon(R.drawable.ic_launcher)
                .setContentIntent(pIntent).getNotification();
        //      .addAction(R.drawable.ic_launcher, "End", pIntent)
        //      .addAction(R.drawable.ic_launcher, "Pause", pIntent).build();

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        // Hide the notification after its selected
        notification.flags |= Notification.FLAG_AUTO_CANCEL;
        //  notification.flags |= Notification.FLAG_FOREGROUND_SERVICE;
        notificationManager.notify(0, notification);

    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        Log.d("CDA", "onBackPressed Called");

        AlertDialog.Builder alertbox = new AlertDialog.Builder(this);
        alertbox.setTitle(getResources().getString(R.string.exitMessageTitle));
        alertbox.setMessage(getResources().getString(R.string.exitMessage));

        alertbox.setPositiveButton(getResources().getString(R.string.yes),
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                        MainActivity.this.mGaTracker.sendEvent("ui_action", "button_press", "exit_button", 1L);
                        MainActivity.this.actionFragment.endAction();
                        MainActivity.this.actionFragment.disableSending();
                        MainActivity.this.finish();
                    }
                });

        alertbox.setNeutralButton(getResources().getString(R.string.no),
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                        MainActivity.this.mGaTracker.sendEvent("ui_action", "button_press", "exit_button", 0L);
                    }
                });
        alertbox.show();

//        Intent setIntent = new Intent(Intent.ACTION_MAIN);
//        setIntent.addCategory(Intent.CATEGORY_HOME);
//        setIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//        startActivity(setIntent);
    }

    public class SectionsPagerAdapter extends FragmentPagerAdapter {
        public SectionsPagerAdapter(FragmentManager fm) {
            super(fm);
        }

        @Override
        public Fragment getItem(int position) {
            switch (position) {
                case 0:
                    // Send a screen view when the Activity is displayed to the user.
                    // MainActivity.this.mGaTracker.sendView("/ActionFragment");
                    return MainActivity.this.actionFragment;
                case 1:
                    // Send a screen view when the Activity is displayed to the user.
                    //  MainActivity.this.mGaTracker.sendView("/ProfileFragment");
                    return MainActivity.this.profileFragment;
                case 2:
                    // Send a screen view when the Activity is displayed to the user.
                    // MainActivity.this.mGaTracker.sendView("/HistoryFragment");
                    return MainActivity.this.historyFragment;
            }
            return null;
        }

        @Override
        public int getCount() {
            // Show 3 total pages.
            return 3;
        }

        @Override
        public CharSequence getPageTitle(int position) {
            Locale l = Locale.getDefault();
            switch (position) {
                case 0:
                    return getString(R.string.title_section1).toUpperCase(l);
                case 1:
                    return getString(R.string.title_section2).toUpperCase(l);
                case 2:
                    return getString(R.string.title_section3).toUpperCase(l);
            }
            return null;
        }
    }
}
