package com.GreMo.GreMoApp.fragments;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.GreMo.GreMoApp.Global;
import com.GreMo.GreMoApp.R;
import com.GreMo.GreMoApp.controller.SendDataTask;
import com.GreMo.GreMoApp.model.HTTPResult;
import com.GreMo.GreMoApp.model.TransmissionData;
import com.google.analytics.tracking.android.GoogleAnalytics;
import com.google.analytics.tracking.android.Tracker;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * fragment for the points page
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class ProfileFragment extends Fragment {
    private static final int SWEEPSTAKE_THRESHOLD = 5000;
    private TextView currentPoints;
    private TextView overallPoints;
    private TextView lastWeekPoints;
    // private SimpleAdapter adapter;
    private Button refreshButton;
    private View rootView;
    private Tracker mGaTracker;
    private GoogleAnalytics mGaInstance;
    private SharedPreferences.Editor deafaultPreferencesEdit;
    private SharedPreferences deafaultPreferences;


    public ProfileFragment() {
        super();
    }

    /**
     * called on creation of the fragment (app start) and sets buttons and listeners
     *
     * @param inflater
     * @param container
     * @param savedInstanceState
     * @return
     */
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        this.rootView = inflater.inflate(R.layout.fragment_points, container, false);

        this.mGaInstance = GoogleAnalytics.getInstance(Global.getMainActivity());
        this.mGaTracker = mGaInstance.getTracker("UA-43209279-1");

        this.currentPoints = (TextView) this.rootView.findViewById(R.id.points_current_value);
        this.overallPoints = (TextView) this.rootView.findViewById(R.id.points_allTime_value);
        this.lastWeekPoints = (TextView) this.rootView.findViewById(R.id.points_week_value);
        this.refreshButton = (Button) this.rootView.findViewById(R.id.buttonRefreshProfile);
        this.refreshButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(Global.getMainActivity(), getString(R.string.updatingPoints), Toast.LENGTH_SHORT).show();
                ProfileFragment.this.mGaTracker.sendEvent("ui_action", "button_press", "profile_refresh_button", 1L);
                ProfileFragment.this.refreshProfile();
            }
        });
        this.deafaultPreferences = PreferenceManager.getDefaultSharedPreferences(Global.getMainActivity());
        this.deafaultPreferencesEdit = deafaultPreferences.edit();
        refreshProfile();
        return rootView;
    }

    @Override
    public void onStart() {
        super.onStart();
    }

    @Override
    public void onResume() {
        super.onResume();

        // Example of how to track a pageview event
        this.mGaTracker.sendView("/ActionFragment");
    }

    /**
     * refreshes the profile data(currently only points), sends an request to the server and updated the view on response
     * TODO: get more data, not just current points
     */
    private void refreshProfile() {

        // clear the list
        // creates TransmissionData object and sends it to the server
        SendDataTask task = new SendDataTask(
                new TransmissionData(
                        TransmissionData.Method.GET,
                        TransmissionData.Interface.GET_PROFILE_DATA.replace(":userId", Global.getUserId() + ""),
                        TransmissionData.PostFuntionType.PROFILEDATA_RETRIEVED,
                        new JSONObject()));// empty
        task.registerHTTPResultObserver(new HTTPResult.Observer() {
            /**
             * if the request was successful updates the view
             *
             * @param data the returned data
             */
            @Override
            public void onHTTPResultUpdate(HTTPResult data) {
                if (!data.isException()) {
                    JSONObject body;
                    try {
                        body = new JSONObject(data.getResponseBodyString());
                        int currentPoints = body.getInt("points") - body.getInt("pointsspent");
                        ProfileFragment.this.currentPoints.setText("" + currentPoints);
                        ProfileFragment.this.overallPoints.setText("" + body.getInt("points"));
                        ProfileFragment.this.lastWeekPoints.setText("" + body.getInt("points_lastweek"));
                        if (body.getInt("points") >= SWEEPSTAKE_THRESHOLD && !ProfileFragment.this.deafaultPreferences.getBoolean("notifiedSweepstake", false)) {
                            ProfileFragment.this.deafaultPreferencesEdit.putBoolean("Sweepstake", true);
                            ProfileFragment.this.deafaultPreferencesEdit.commit();
                            ProfileFragment.this.sweepstakeAlert();
                        }
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    Toast.makeText(Global.getMainActivity(), getString(R.string.updatedPoints), Toast.LENGTH_SHORT).show();
                }
            }
        });
        task.execute();
    }

    /**
     * creates an AlertDialog that asks the user to join the sweepstake
     *
     * @return the AlertDialog
     */
    public void sweepstakeAlert() {

        AlertDialog.Builder alertbox = new AlertDialog.Builder(Global.getMainActivity());
        alertbox.setTitle(R.string.sweepstakeTitle);
        alertbox.setMessage(R.string.sweepstakeMessage);

        alertbox.setCancelable(false);

        alertbox.setPositiveButton(R.string.yes,
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                        ProfileFragment.this.deafaultPreferencesEdit.putBoolean("notifiedSweepstake", true);
                        ProfileFragment.this.deafaultPreferencesEdit.commit();
                        String url = "http://www.ma-gremo.de/";
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                    }
                });


        alertbox.setNegativeButton(R.string.no,
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                        ProfileFragment.this.deafaultPreferencesEdit.putBoolean("notifiedSweepstake", true);
                        ProfileFragment.this.deafaultPreferencesEdit.commit();
                    }
                });

        alertbox.setNeutralButton(R.string.rememberSweepstakeLater,
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                    }
                });
        alertbox.show();
    }
}
