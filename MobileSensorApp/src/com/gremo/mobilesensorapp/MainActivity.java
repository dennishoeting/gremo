package com.gremo.mobilesensorapp;

import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.Menu;

import com.gremo.mobilesensorapp.controller.DatabaseController;
import com.gremo.mobilesensorapp.controller.GremoExceptionHandler;
import com.gremo.mobilesensorapp.fragment.DBFragment;
import com.gremo.mobilesensorapp.fragment.MapFragment;
import com.gremo.mobilesensorapp.fragment.SensorFragment;
import com.gremo.mobilesensorapp.fragment.WiFiScannerFragment;

import java.util.Locale;

public class MainActivity extends FragmentActivity {

    private WiFiScannerFragment wifiScannerFragment;
    private SensorFragment sensorFragment;
    private DBFragment databaseFragment;
    private MapFragment mapFragment;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Thread.setDefaultUncaughtExceptionHandler(new GremoExceptionHandler(this));
        setContentView(R.layout.activity_main);

        WifiManager wifiManager = (WifiManager) getSystemService(WIFI_SERVICE);
        WifiInfo wInfo = wifiManager.getConnectionInfo();

        Global.setMainActivity(this);
        Global.setMacAddress(wInfo.getMacAddress());

        // Create the adapter that will return a fragment for each of the three
        // primary sections of the app.
        /*
      The {@link android.support.v4.view.PagerAdapter} that will provide
      fragments for each of the sections. We use a
      {@link android.support.v4.app.FragmentPagerAdapter} derivative, which
      will keep every loaded fragment in memory. If this becomes too memory
      intensive, it may be best to switch to a
      {@link android.support.v4.app.FragmentStatePagerAdapter}.
     */
        SectionsPagerAdapter mSectionsPagerAdapter = new SectionsPagerAdapter(getSupportFragmentManager());

        // Set up the ViewPager with the sections adapter.
        /*
      The {@link android.support.v4.view.ViewPager} that will host the section contents.
     */
        ViewPager mViewPager = (ViewPager) findViewById(R.id.pager);
        mViewPager.setAdapter(mSectionsPagerAdapter);
        mViewPager.setOffscreenPageLimit(4);

        DatabaseController databaseController = DatabaseController.getInstance();

        this.mapFragment = new MapFragment();

        this.wifiScannerFragment = new WiFiScannerFragment();
        this.wifiScannerFragment.registerDBEntryObserver(databaseController);

        this.sensorFragment = new SensorFragment();
        this.sensorFragment.registerDBEntryObserver(databaseController);

        this.databaseFragment = new DBFragment();

        //EXCEPTION!!!!!!!
//        String name = null;
//        if (name.equals("Java")) {
//        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    /**
     * A {@link android.support.v4.app.FragmentPagerAdapter} that returns a fragment corresponding to
     * one of the sections/tabs/pages.
     */
    public class SectionsPagerAdapter extends FragmentPagerAdapter {

        public SectionsPagerAdapter(FragmentManager fm) {
            super(fm);
        }

        @Override
        public Fragment getItem(int position) {
            // getItem is called to instantiate the fragment for the given page.
            switch (position) {
                case 0:
                    return MainActivity.this.mapFragment;
                case 1:
                    return MainActivity.this.wifiScannerFragment;
                case 2:
                    return MainActivity.this.sensorFragment;
                case 3:
                    return MainActivity.this.databaseFragment;
            }
            return null;
        }

        @Override
        public int getCount() {
            // Show 4 total pages.
            return 4;
        }

        @Override
        public CharSequence getPageTitle(int position) {
            Locale locale = Locale.getDefault();
            switch (position) {
                case 0:
                    return getString(R.string.title_section0).toUpperCase(locale);
                case 1:
                    return getString(R.string.title_section1).toUpperCase(locale);
                case 2:
                    return getString(R.string.title_section2).toUpperCase(locale);
                case 3:
                    return getString(R.string.title_section3).toUpperCase(locale);
            }
            return null;
        }
    }

}
