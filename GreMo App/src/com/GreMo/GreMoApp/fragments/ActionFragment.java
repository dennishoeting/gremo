package com.GreMo.GreMoApp.fragments;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.app.Fragment;
import android.text.format.Time;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.RadioGroup;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.GreMo.GreMoApp.Global;
import com.GreMo.GreMoApp.R;
import com.GreMo.GreMoApp.controller.DatabaseController;
import com.GreMo.GreMoApp.controller.SendDataScheduler;
import com.GreMo.GreMoApp.model.BluetoothData;
import com.GreMo.GreMoApp.model.BluetoothSensor;
import com.GreMo.GreMoApp.model.DBEvent;
import com.GreMo.GreMoApp.model.LocationData;
import com.GreMo.GreMoApp.model.LocationSensor;
import com.GreMo.GreMoApp.model.MotionData;
import com.GreMo.GreMoApp.model.MotionSensor;
import com.GreMo.GreMoApp.model.TransmissionData;
import com.GreMo.GreMoApp.model.WifiData;
import com.GreMo.GreMoApp.model.WifiSensor;
import com.google.analytics.tracking.android.GoogleAnalytics;
import com.google.analytics.tracking.android.Tracker;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;

/**
 * fragment for the start page
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class ActionFragment extends Fragment implements LocationData.Observer, WifiData.Observer, DBEvent.Observer, TransmissionData.Provider, MotionData.Observer, BluetoothData.Observer {
    //movement types
    private static final int MOVMENT_TYPE_ID_UNKNOWN = 1;
    private static final int MOVMENT_TYPE_ID_WALKING = 2;
    private static final int MOVMENT_TYPE_ID_BIKING = 3;
    //provider types
    private static final int PROVIDER_TYPE_ID_UNKNOWN = 1;
    private static final int PROVIDER_TYPE_ID_GPS = 2;
    private static final int PROVIDER_TYPE_ID_NET = 3;
    private static final int GPS_REQUEST_CODE = 1;
    private static final int BLUETOOTH_REQUEST_CODE = 2;
    public final WifiSensor wifiSensor;
    private final DatabaseController databaseController;
    //private final String[] from = new String[]{"ID", "METHOD", "URL", "DATA", "POSTFUNC"};
    //   private final int[] to = new int[]{R.id.dbId, R.id.dbMethod, R.id.dbUrl, R.id.dbData, R.id.dbPostFunc};
    // private final List<Map<String, String>> dbList = new ArrayList<Map<String, String>>();
    public final SendDataScheduler sendDataScheduler;
    private final ArrayList<TransmissionData.Observer> observers = new ArrayList<TransmissionData.Observer>();
    private final LocationSensor locationSensor;
    private final MotionSensor motionSensor;
    private final BluetoothSensor bluetoothSensor;
    // private SimpleAdapter adapter;
    //private ListView dbListView;
    private int unsentMessages = 0;
    private RadioGroup radioTypeOfMovement;
    private int movementTypeId;
    private ToggleButton buttonAction;
    private Switch switchSending;
    private Button buttonDeleteData;
    private View rootView;
    private SharedPreferences userDetails;
    private SharedPreferences.Editor userDetailsEdit;
    private Tracker mGaTracker;
    private GoogleAnalytics mGaInstance;
    private SharedPreferences deafaultPreferences;
    private SharedPreferences.Editor deafaultPreferencesEdit;

    public ActionFragment() {
        super();

        this.locationSensor = LocationSensor.getInstance();
        this.locationSensor.registerLocationObserver(this);

        this.wifiSensor = WifiSensor.getInstance();
        this.wifiSensor.registerWifiDataObserver(this);

        this.motionSensor = MotionSensor.getInstance();
        this.motionSensor.registerMotionDataObserver(this);

        this.databaseController = DatabaseController.getInstance();
        this.databaseController.registerDBEventObserver(this);

        this.bluetoothSensor = BluetoothSensor.getInstance();
        this.bluetoothSensor.registerBluetoothDataObserver(this);

        this.sendDataScheduler = SendDataScheduler.getInstance();


    }


    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.mGaInstance = GoogleAnalytics.getInstance(Global.getMainActivity());
        this.mGaTracker = mGaInstance.getTracker("UA-43209279-1");

        this.deafaultPreferences = PreferenceManager.getDefaultSharedPreferences(Global.getMainActivity());
        this.deafaultPreferencesEdit = deafaultPreferences.edit();

        this.userDetails = Global.getMainActivity().getSharedPreferences("userdetails", 0);
        this.userDetailsEdit = userDetails.edit();


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
        this.rootView = inflater.inflate(R.layout.fragment_action, container, false);

        this.mGaInstance = GoogleAnalytics.getInstance(Global.getMainActivity());
        this.mGaTracker = mGaInstance.getTracker("UA-43209279-1");


        // movement type radio buttons
        this.radioTypeOfMovement = (RadioGroup) this.rootView.findViewById(R.id.radioTypeOfMovement);

        // start action toggle button
        this.buttonAction = (ToggleButton) rootView.findViewById(R.id.buttonAction);

        this.buttonAction.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                ActionFragment.this.mGaTracker.sendEvent("ui_action", "button_press", "toggle_action_button", 1L);

                int id = ActionFragment.this.radioTypeOfMovement.getCheckedRadioButtonId();
                switch (id) {
                    case R.id.radioBiking:
                        ActionFragment.this.movementTypeId = MOVMENT_TYPE_ID_BIKING;
                        break;
                    case R.id.radioWalking:
                        ActionFragment.this.movementTypeId = MOVMENT_TYPE_ID_WALKING;
                        break;
                    default:
                        ActionFragment.this.movementTypeId = MOVMENT_TYPE_ID_UNKNOWN;
                        break;
                }

                //disable or enable radio buttons [setEnabled on the whole group does not work]
                for (int i = 0; i < ActionFragment.this.radioTypeOfMovement.getChildCount(); i++) {
                    ActionFragment.this.radioTypeOfMovement.getChildAt(i).setEnabled(!isChecked);
                }
                // starting action
                if (isChecked) {
                    ActionFragment.this.mGaTracker.sendEvent("ui_action", "button_press", "toggle_action_button", 1L);
                    // ActionFragment.this.refreshList();
                    activateSensors();
                } else {
                    ActionFragment.this.mGaTracker.sendEvent("ui_action", "button_press", "toggle_action_button", 0L);
                    endAction();
                }
            }
        });

        this.switchSending = (Switch) this.rootView.findViewById(R.id.switchSending);
        this.switchSending.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (isChecked) {
                    ActionFragment.this.sendDataScheduler.enable();
                    ActionFragment.this.mGaTracker.sendEvent("ui_action", "button_press", "sending_switch", 1L);
                } else {
                    ActionFragment.this.sendDataScheduler.disable();
                    ActionFragment.this.mGaTracker.sendEvent("ui_action", "button_press", "sending_switch", 0L);
                }
            }
        });


        this.buttonDeleteData = (Button) this.rootView.findViewById(R.id.buttonDeleteData);
        this.buttonDeleteData.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                deleteDataAlert().show();
            }
        });


        this.unsentMessages = this.databaseController.getDataCount();
        Log.d("TEST", "------------------------------------------------- " + this.unsentMessages);
        this.refreshMessageCounter();

        // for the data list
        //this.adapter = new SimpleAdapter(Global.getMainActivity(), this.dbList, R.layout.db_item, this.from, this.to);
        // this.dbListView = (ListView) this.rootView.findViewById(R.id.listViewDB);
        //   this.dbListView.setAdapter(adapter);

        // this.refreshList();

        return this.rootView;
    }

    @Override
    public void onStart() {
        super.onStart();
    }

    public void disableSending() {
        this.switchSending.setChecked(false);
        this.sendDataScheduler.disable();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (this.unsentMessages < 0 && this.rootView != null) {
            ((TextView) (this.rootView.findViewById(R.id.unsentMessagesValue))).setText("0");
        } else if (this.rootView != null) {
            ((TextView) (this.rootView.findViewById(R.id.unsentMessagesValue))).setText(this.unsentMessages + "");
        }
        // Example of how to track a pageview event
        this.mGaTracker.sendView("/ActionFragment");
    }

    /**
     * starts an action
     */
    private void startAction() {
        this.refreshMessageCounter();

        JSONObject startActionObject = new JSONObject();
        try {
            startActionObject.put("mac", Global.getMacAddress());
            startActionObject.put("actionType", this.movementTypeId);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        ActionFragment.this.userDetailsEdit.putBoolean("notify", true);
        ActionFragment.this.userDetailsEdit.commit();
                    /*
                     * Start action
                     */
        ActionFragment.this.notifyDBEntryObservers(
                new TransmissionData(
                        TransmissionData.Method.POST,
                        TransmissionData.Interface.PUSH_ACTION.replace(":userId", Global.getUserId() + ""),
                        TransmissionData.PostFuntionType.ACTION_PUSHED,
                        startActionObject
                )
        );
    }

    /**
     * ends an action
     */
    public void endAction() {

        if (this.userDetails.getBoolean("notify", true)) {
            this.userDetailsEdit.putBoolean("notify", false);
            this.userDetailsEdit.commit();

            JSONObject jsonObject = new JSONObject();


            try {
                jsonObject.put("offset", this.userDetails.getLong("offset", 0));
            } catch (JSONException e) {
                e.printStackTrace();
            }

            ActionFragment.this.notifyDBEntryObservers(
                    new TransmissionData(
                            TransmissionData.Method.PUT,
                            TransmissionData.Interface.END_ACTION.replace(":userId", Global.getUserId() + ""),
                            TransmissionData.PostFuntionType.ACTION_ENDED,
                            jsonObject
                    )
            );
             /*
              * Deactivate location sensor
              * Deactivate wifi sensor
              */
            ActionFragment.this.locationSensor.disable();
            ActionFragment.this.wifiSensor.disable();
            ActionFragment.this.motionSensor.disable();
            ActionFragment.this.bluetoothSensor.disable();
        }
    }

    private void activateSensors() {

                           /*
                     * Activate gps and/or net sensor and start action
                     */
        Boolean GPSNoException = true;
        if (ActionFragment.this.deafaultPreferences.getBoolean("net_switch", true) || ActionFragment.this.deafaultPreferences.getBoolean("gps_switch", true)) {
            try {
                ActionFragment.this.locationSensor.enable();
            } catch (LocationSensor.NoGPSException e) {
                GPSNoException = false;
                ActionFragment.this.buttonAction.setChecked(false);
                getNoLocationAlert("GPS").show();
            } catch (LocationSensor.NoNetLocException e) {
                GPSNoException = false;
                ActionFragment.this.buttonAction.setChecked(false);
                getNoLocationAlert("Network").show();
            }
        }

                    /*
                     * Activate wifi sensor
                     */
        if (ActionFragment.this.deafaultPreferences.getBoolean("wifi_switch", true) && GPSNoException) {
            ActionFragment.this.wifiSensor.enable();

        }
/*
                     * Activate motion sensor
                     */
        if (ActionFragment.this.deafaultPreferences.getBoolean("motion_switch", true) && GPSNoException) {
            ActionFragment.this.motionSensor.enable();
        }
/*
                     * Activate bluetooth sensor
                     */
        if (ActionFragment.this.deafaultPreferences.getBoolean("bluetooth_switch", true) && GPSNoException) {
            try {
                ActionFragment.this.bluetoothSensor.enable();
            } catch (BluetoothSensor.BluetoothEnableException e) {
                getNoBluetoothAlert();
            }
        }
        if (GPSNoException) {
            startAction();
        }
    }

    /**
     * re-enableds locationSensor (after Android location settings were visited)
     */
    public void enableLocationAfterSettings() {
        ActionFragment.this.locationSensor.disable();
        try {
            ActionFragment.this.locationSensor.enable();
        } catch (LocationSensor.NoGPSException e) {
            getNoLocationAlert("GPS").show();
        } catch (LocationSensor.NoNetLocException e) {
            getNoLocationAlert("Network").show();
        }
    }

    /**
     * gets a data object, creates a JSON object and a TransmissionData object and notifies the DBEntryObservers
     *
     * @param data the data that will be send to the DBEntryObservers
     */
    @Override
    public void onWifiDataUpdate(WifiData data) {
        Time now = new Time();
        now.setToNow();
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("wifirouterBSSIDs", new JSONArray(Arrays.asList(data.getData().keySet().toArray())));
            jsonObject.put("wifirouterSSIDs", new JSONArray(Arrays.asList(data.getData().values().toArray())));
            jsonObject.put("time", now.toMillis(false));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        TransmissionData entry = new TransmissionData(
                TransmissionData.Method.PUT,
                TransmissionData.Interface.PUSH_WIFI.replace(":userId", "" + Global.getUserId()),
                TransmissionData.PostFuntionType.WIFI_PUSHED,
                jsonObject);
        this.notifyDBEntryObservers(entry);
    }

    /**
     * gets a data object, creates a JSON object and a TransmissionData object and notifies the DBEntryObservers
     *
     * @param data the data that will be send to the DBEntryObservers
     */
    @Override
    public void onLocationUpdate(LocationData data) {

        Time now = new Time();
        now.setToNow();

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("lat", data.getData().getLatitude());
            jsonObject.put("lng", data.getData().getLongitude());
            jsonObject.put("time", now.toMillis(false));
            jsonObject.put("speed", data.getData().getSpeed());
            jsonObject.put("accuracy", data.getData().getAccuracy());
            /**
             * location provider:
             *  - unknown = 1
             *  - gps = 2
             *  - network = 3
             *  - imported = 4
             */
            if (data.getData().getProvider().equals("gps")) {
                jsonObject.put("providerId", PROVIDER_TYPE_ID_GPS);
            } else if (data.getData().getProvider().equals("network")) {
                jsonObject.put("providerId", PROVIDER_TYPE_ID_NET);
            } else {
                jsonObject.put("providerId", PROVIDER_TYPE_ID_UNKNOWN);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        TransmissionData entry = new TransmissionData(
                TransmissionData.Method.PUT,
                TransmissionData.Interface.PUSH_GPS.replace(":userId", "" + Global.getUserId()),
                TransmissionData.PostFuntionType.LOCATION_PUSHED,
                jsonObject);
        this.notifyDBEntryObservers(entry);
    }

    @Override
    public void onMotionDataUpdate(MotionData data) {

        Time now = new Time();
        now.setToNow();

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("time", now.toMillis(false));
            jsonObject.put("x", data.getData().values[0]);
            jsonObject.put("y", data.getData().values[1]);
            jsonObject.put("z", data.getData().values[2]);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        TransmissionData entry = new TransmissionData(
                TransmissionData.Method.PUT,
                TransmissionData.Interface.PUSH_MOTION.replace(":userId", "" + Global.getUserId()),
                TransmissionData.PostFuntionType.MOTON_PUSHED,
                jsonObject);
        this.notifyDBEntryObservers(entry);
    }

    /**
     * refreshes the database view
     *
     * @param data
     */
    @Override
    public void onDBEventUpdate(DBEvent data) {
        switch (data.getType()) {
            // add new data
            case CREATED:
                this.unsentMessages++;
                this.refreshMessageCounter();
//                Map<String, String> map = new HashMap<String, String>();
//                map.put(ActionFragment.this.from[0], "" + data.getData().getIds());
//                map.put(ActionFragment.this.from[1], data.getData().getMethodString());
//                map.put(ActionFragment.this.from[2], data.getData().getPath());
//                map.put(ActionFragment.this.from[3], data.getData().getData().toString());
//                map.put(ActionFragment.this.from[4], data.getData().getPostFuntionTypeString());
//                this.dbList.add(map);
//                adapter.notifyDataSetChanged();
                break;
//            // delete data
            case DELETED:
                this.unsentMessages--;
                this.refreshMessageCounter();
//                dbListLoop:
//                for (Map<String, String> entry : this.dbList) {
//                    for (int i = 0; i < data.getData().getIds().size(); i++) {
//                        if (entry.get("ID").equals("[" + data.getData().getIds().get(i) + "]")) {
//                            this.dbList.remove(entry);
//                            adapter.notifyDataSetChanged();
//                            break dbListLoop;
//                        }
//                    }
//                }
                break;
            case DELETEDALL:
                this.unsentMessages = 0;
                this.refreshMessageCounter();
                break;
        }
    }

    @Override
    public void registerDBEntryObserver(TransmissionData.Observer observer) {
        this.observers.add(observer);
    }

    @Override
    public void removeDBEntryObserver(TransmissionData.Observer observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyDBEntryObservers(TransmissionData data) {
        for (TransmissionData.Observer observer : this.observers) {
            observer.onDBEntryUpdate(data);
        }
    }

    /**
     * refreshes the whole databaseview. Gets data all data from the db and shows it
     */
//    private void refreshList() {
//        try {
//            this.dbList.clear();
//            this.unsentMessages = 0;
//            this.sentMessages = 0;
//
//            for (TransmissionData dbEntry : databaseController.getAllDataObjects()) {
//                this.unsentMessages++;
//                Map<String, String> map = new HashMap<String, String>();
//                map.put(this.from[0], "" + dbEntry.getIds());
//                map.put(this.from[1], dbEntry.getMethodString());
//                map.put(this.from[2], dbEntry.getPath());
//                map.put(this.from[3], dbEntry.getData().toString());
//                map.put(this.from[4], dbEntry.getPostFuntionTypeString());
//                this.dbList.add(map);
//            }
//            this.refreshMessageCounter();
//            adapter.notifyDataSetChanged();
//        } catch (JSONException e) {
//            e.printStackTrace();
//        }
//    }

    /**
     * creates an AlertDialog that asks the user to enable the location type. Starts the Android Location settings
     *
     * @param locationType te type of location that is disabled but should be used
     * @return the AlertDialog
     */
    private AlertDialog getNoLocationAlert(final String locationType) {
        final AlertDialog.Builder builder = new AlertDialog.Builder(Global.getMainActivity());
        builder.setMessage(
                getResources().getString(R.string.your) + " " + locationType + " " + getResources().getString(R.string.enableGps) + "?")
                .setCancelable(false)
                        /**
                         * if the response is positive
                         * - oen Android location settings
                         */

                .setPositiveButton(getResources().getString(R.string.yes),
                        new DialogInterface.OnClickListener() {
                            public void onClick(final DialogInterface dialog,
                                                final int id) {

                                Global.getMainActivity().startActivityForResult(new Intent(
                                        android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS), GPS_REQUEST_CODE);
                            }
                        })
                        /**
                         * if the response is negative
                         * - close the dialog
                         * - disable the right switch (GPS or Network)
                         */
                .setNegativeButton(getResources().getString(R.string.no), new DialogInterface.OnClickListener() {
                    public void onClick(final DialogInterface dialog,
                                        final int id) {

                        if (locationType.equals("GPS") &&
                                (!ActionFragment.this.deafaultPreferences.getBoolean("net_switch", false) &&
                                        !ActionFragment.this.deafaultPreferences.getBoolean("wifi_switch", false)
                                ) ||

                                locationType.equals("Network") &&
                                        (!ActionFragment.this.deafaultPreferences.getBoolean("gps_switch", false) &&
                                                !ActionFragment.this.deafaultPreferences.getBoolean("wifi_switch", false)
                                        )
                                ) {
                            Toast.makeText(Global.getMainActivity(),
                                    R.string.atLeastOneLocError,
                                    Toast.LENGTH_LONG).show();
                            ActionFragment.this.buttonAction.setChecked(false);

                    /*
                     * Deactivate all sensors
                     */
                            ActionFragment.this.locationSensor.disable();
                            ActionFragment.this.wifiSensor.disable();
                            ActionFragment.this.bluetoothSensor.disable();
                            ActionFragment.this.motionSensor.disable();

                        } else if (locationType.equals("GPS")) {
                            ActionFragment.this.deafaultPreferencesEdit.putBoolean("gps_switch", false);
                            ActionFragment.this.deafaultPreferencesEdit.commit();
                        } else if (locationType.equals("Network")) {
                            ActionFragment.this.deafaultPreferencesEdit.putBoolean("net_switch", false);
                            ActionFragment.this.deafaultPreferencesEdit.commit();
                        }
                        dialog.cancel();
                    }
                });

        return builder.create();
    }

    /**
     * creates an AlertDialog that asks the user to enable the bluetooth. Starts the Android bluetooth settings
     *
     * @return the AlertDialog
     */
    private AlertDialog getNoBluetoothAlert() {
        final AlertDialog.Builder builder = new AlertDialog.Builder(Global.getMainActivity());
        builder.setMessage(
                getResources().getString(R.string.enableBluetoothError))
                .setCancelable(false)
                        /**
                         * if the response is positive
                         * - oen Android bluetooth settings
                         */

                .setPositiveButton(getResources().getString(R.string.yes),
                        new DialogInterface.OnClickListener() {
                            public void onClick(final DialogInterface dialog,
                                                final int id) {

                                Global.getMainActivity().startActivityForResult(new Intent(
                                        android.provider.Settings.ACTION_BLUETOOTH_SETTINGS), BLUETOOTH_REQUEST_CODE);
                            }
                        })
                        /**
                         * if the response is negative
                         * - close the dialog
                         * - disable the bluetooth switch
                         */
                .setNegativeButton(getResources().getString(R.string.no), new DialogInterface.OnClickListener() {
                    public void onClick(final DialogInterface dialog,
                                        final int id) {
                        Toast.makeText(Global.getMainActivity(),
                                R.string.bluetoothDisabledError,
                                Toast.LENGTH_LONG).show();

                        dialog.cancel();
                    }
                });

        return builder.create();
    }

    private AlertDialog deleteDataAlert() {
        final AlertDialog.Builder builder = new AlertDialog.Builder(Global.getMainActivity());
        builder.setMessage(
                getResources().getString(R.string.delete_data_mesage))
                .setCancelable(false)


                .setPositiveButton(getResources().getString(R.string.yes),
                        new DialogInterface.OnClickListener() {
                            public void onClick(final DialogInterface dialog,
                                                final int id) {
                                ActionFragment.this.databaseController.deleteAllData();

                            }
                        })

                .setNegativeButton(getResources().getString(R.string.no), new DialogInterface.OnClickListener() {
                    public void onClick(final DialogInterface dialog,
                                        final int id) {


                    }
                });

        return builder.create();
    }

    /**
     * refreshes the message count of the db view
     */

    //TODO: Nur wenn App im Vordergrund, "this.rootView != null" ist keine schöne lösung
    private void refreshMessageCounter() {
        if (this.unsentMessages < 0 && this.rootView != null) {
            ((TextView) (this.rootView.findViewById(R.id.unsentMessagesValue))).setText("0");
        } else if (this.rootView != null) {
            ((TextView) (this.rootView.findViewById(R.id.unsentMessagesValue))).setText(this.unsentMessages + "");
        }
    }

    @Override
    public void onBluetoothDataUpdate(BluetoothData bluetoothData) {
        JSONObject jsonObject = new JSONObject();

        try {
            JSONArray jsonDeviceList = new JSONArray();
            for (BluetoothData.BluetoothScan scan : bluetoothData.getData()) {
                JSONObject jsonDevice = new JSONObject();
                jsonDevice.put("time", scan.getTime().getTimeInMillis());
                jsonDevice.put("bluetoothId", scan.getDevice().getAddress());
                jsonDevice.put("bluetoothClass", scan.getDevice().getBluetoothClass().getDeviceClass());
                jsonDeviceList.put(jsonDevice);
            }
            jsonObject.put("scanResult", jsonDeviceList);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        this.notifyDBEntryObservers(
                new TransmissionData(
                        TransmissionData.Method.PUT,
                        TransmissionData.Interface.PUSH_BLUETOOTH_DATA.replace(":userId", "" + Global.getUserId()),
                        TransmissionData.PostFuntionType.SEND_BLUETOOTH_DATA,
                        jsonObject));

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
            case GPS_REQUEST_CODE:
                this.endAction();
                this.startAction();
                break;

            case BLUETOOTH_REQUEST_CODE:
                this.endAction();
                this.startAction();
                break;
        }

    }
}