package com.GreMo.GreMoApp.fragments;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.net.Uri;
import android.os.Bundle;
import android.preference.Preference;
import android.preference.PreferenceFragment;
import android.preference.PreferenceManager;
import android.util.Log;

import com.GreMo.GreMoApp.Global;
import com.GreMo.GreMoApp.R;

/**
 * fragment for the settings page
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class SettingsFragment extends PreferenceFragment implements OnSharedPreferenceChangeListener {


    private static Preference useGPS;
    private static Preference useNet;
    private static Preference useWiFi;
    private static Preference useBluetooth;
    private static Preference useMotion;
    private static Preference sweepstakeButton;
    public Intent data = new Intent();
    private SharedPreferences sharedPreferences;
    private SharedPreferences.Editor deafaultPreferencesEdit;

    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        addPreferencesFromResource(R.layout.fragment_settings);
        PreferenceManager.setDefaultValues(getActivity(),
                R.layout.fragment_settings, false);
        this.sharedPreferences = PreferenceManager.getDefaultSharedPreferences(Global.getMainActivity());
        this.sharedPreferences.registerOnSharedPreferenceChangeListener(this);
        this.deafaultPreferencesEdit = sharedPreferences.edit();

        this.useGPS = findPreference("gps_switch");
        this.useNet = findPreference("net_switch");
        this.useWiFi = findPreference("wifi_switch");
        this.useBluetooth = findPreference("bluetooth_switch");
        this.useMotion = findPreference("motion_switch");

        this.sweepstakeButton = findPreference("sweepstake_button");

        this.sweepstakeButton.setOnPreferenceClickListener(new Preference.OnPreferenceClickListener() {
            @Override
            public boolean onPreferenceClick(Preference preference) {
                Log.d("++++++++++++++++++++++++++++++++++++++++++++", "GEWINNSPIEL CLICKED");
                AlertDialog.Builder alertbox = new AlertDialog.Builder(getActivity());
                alertbox.setTitle(R.string.sweepstakeTitle);
                if (SettingsFragment.this.sharedPreferences.getBoolean("Sweepstake", false)) {
                    alertbox.setMessage(R.string.sweepstakeMessage);

                    alertbox.setCancelable(false);

                    alertbox.setPositiveButton(R.string.yes,
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface arg0, int arg1) {
                                    SettingsFragment.this.deafaultPreferencesEdit.putBoolean("notifiedSweepstake", true);
                                    SettingsFragment.this.deafaultPreferencesEdit.commit();
                                    String url = "http://www.ma-gremo.de/";
                                    Intent intent = new Intent(Intent.ACTION_VIEW);
                                    intent.setData(Uri.parse(url));
                                    startActivity(intent);
                                }
                            });


                    alertbox.setNegativeButton(R.string.no,
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface arg0, int arg1) {
                                    SettingsFragment.this.deafaultPreferencesEdit.putBoolean("notifiedSweepstake", true);
                                    SettingsFragment.this.deafaultPreferencesEdit.commit();
                                }
                            });

                    alertbox.setNeutralButton(R.string.rememberSweepstakeLater,
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface arg0, int arg1) {
                                }
                            });
                } else {
                    alertbox.setMessage(R.string.noSweepstakeMessage);

                    alertbox.setCancelable(false);

                    alertbox.setPositiveButton(R.string.ok,
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface arg0, int arg1) {

                                }
                            });
                }
                alertbox.show();
                return true;
            }
        });


        //this.sweepstakeButton.setEnabled(sharedPreferences.getBoolean("Sweepstake", false));
        this.useWiFi.setEnabled(sharedPreferences.getBoolean(useGPS.getKey(), true) || sharedPreferences.getBoolean(useNet.getKey(), true));
        this.useNet.setEnabled(sharedPreferences.getBoolean(useGPS.getKey(), true) || sharedPreferences.getBoolean(useWiFi.getKey(), true));
        this.useGPS.setEnabled(sharedPreferences.getBoolean(useNet.getKey(), true) || sharedPreferences.getBoolean(useWiFi.getKey(), true));
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        this.useWiFi.setEnabled(sharedPreferences.getBoolean(useGPS.getKey(), false) || sharedPreferences.getBoolean(useNet.getKey(), false));
        this.useNet.setEnabled(sharedPreferences.getBoolean(useGPS.getKey(), false) || sharedPreferences.getBoolean(useWiFi.getKey(), false));
        this.useGPS.setEnabled(sharedPreferences.getBoolean(useNet.getKey(), false) || sharedPreferences.getBoolean(useWiFi.getKey(), false));
    }
}