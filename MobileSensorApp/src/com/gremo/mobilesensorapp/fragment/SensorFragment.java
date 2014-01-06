package com.gremo.mobilesensorapp.fragment;

import android.location.Location;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.ListView;
import android.widget.SimpleAdapter;
import android.widget.Switch;
import android.widget.Toast;

import com.gremo.mobilesensorapp.Global;
import com.gremo.mobilesensorapp.R;
import com.gremo.mobilesensorapp.model.BluetoothData;
import com.gremo.mobilesensorapp.model.BluetoothSensor;
import com.gremo.mobilesensorapp.model.Hotspot;
import com.gremo.mobilesensorapp.model.HotspotData;
import com.gremo.mobilesensorapp.model.LocationData;
import com.gremo.mobilesensorapp.model.LocationSensor;
import com.gremo.mobilesensorapp.model.TransmissionData;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for the sensor fragment.
 */
public class SensorFragment extends Fragment implements LocationData.Observer, BluetoothData.Observer, HotspotData.Observer, TransmissionData.Provider {
    private static final int GREMO_WIFI_SENSOR = 1;
    private static final int PRIMARY_BLUETOOTH_SENSOR = 1;
    private final String[] from = new String[]{"MAC"};
    private final int[] to = new int[]{R.id.btId};
    private final List<Map<String, String>> bluetoothList = new ArrayList<Map<String, String>>();
    public String hotSpotName = "Gremo Sensor Hotspot"; //FIXME: Put into settings
    private ArrayList<TransmissionData.Observer> observers = new ArrayList<TransmissionData.Observer>();
    private SimpleAdapter bluetoothListAdapter;
    // Current location
    private Location location;
    private BluetoothSensor bluetoothSensor;
    private Hotspot wifiHotspot;
    private Switch switchHotSpot, switchBluetooth;
    private boolean ready = false;
    private ListView bluetoothListView;

    private long lastTime;
    private int fullScanCounter;
    private int scanCounter;

    public SensorFragment() {
        super();

        LocationSensor locationSensor = LocationSensor.getInstance();
        locationSensor.registerLocationObserver(this);

        this.wifiHotspot = Hotspot.getInstance();
        this.wifiHotspot.registerHotspotDataObserver(this);

        this.bluetoothSensor = BluetoothSensor.getInstance();
        this.bluetoothSensor.registerBluetoothDataObserver(this);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        super.onCreateView(inflater, container, savedInstanceState);

        View rootView = inflater.inflate(R.layout.fragment_sensor, container, false);

        this.switchHotSpot = (Switch) rootView.findViewById(R.id.switchHotSpot);
        this.switchHotSpot.setChecked(false);
        this.switchHotSpot.setEnabled(false);
        this.switchHotSpot.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean isChecked) {
                if (isChecked) {
                    /*
                     * Enable Hotspot
                     */
                    SensorFragment.this.wifiHotspot.enable();
                } else {
                    /*
                     * Disable Hotspot
                     */
                    SensorFragment.this.wifiHotspot.disable();
                }
            }
        });

        this.switchBluetooth = (Switch) rootView.findViewById(R.id.switchBluetooth);
        this.switchBluetooth.setChecked(false);
        this.switchBluetooth.setEnabled(false);
        this.switchBluetooth.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean isChecked) {
                if (isChecked) {
                    SensorFragment.this.lastTime = System.currentTimeMillis();
                    SensorFragment.this.bluetoothList.clear();
                    SensorFragment.this.fullScanCounter = 0;
                    SensorFragment.this.scanCounter = 0;

                    /*
                     * Enable Bluetooth
                     */
                    try {
                        SensorFragment.this.bluetoothSensor.enable();
                    } catch (BluetoothSensor.BluetoothEnableException e) {
                        Toast.makeText(Global.getMainActivity(),
                                "No bluetooth available..",
                                Toast.LENGTH_SHORT).show();

                    }
                    JSONObject jsonObject = new JSONObject();
                    try {
                        jsonObject.put("lat", SensorFragment.this.location.getLatitude());
                        jsonObject.put("lng", SensorFragment.this.location.getLongitude());
                        jsonObject.put("bssid", Global.getMacAddress());
                        jsonObject.put("typeId", PRIMARY_BLUETOOTH_SENSOR);

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    TransmissionData data = new TransmissionData(TransmissionData.Method.POST, TransmissionData.Interface.ADD_BLUETOOTH, TransmissionData.PostFuntionType.CREATE_BLUETOOTH_SENSOR, jsonObject);
                    SensorFragment.this.notifyDBEntryObservers(data);

                } else {
                    /*
                     * Disable Bluetooth
                     */
                    SensorFragment.this.bluetoothSensor.disable();

                    SensorFragment.this.bluetoothListAdapter.notifyDataSetChanged();
                }
            }
        });
        this.bluetoothListAdapter = new SimpleAdapter(Global.getMainActivity(), this.bluetoothList, R.layout.bluetooth_item, this.from, this.to);

        this.bluetoothListView = (ListView) rootView.findViewById(R.id.listViewBluetooth);
        bluetoothListView.setAdapter(bluetoothListAdapter);

        this.ready = true;
        return rootView;
    }

    @Override
    public void onLocationUpdate(LocationData location) {
        if (ready) {
            this.location = location.getData();

            boolean locationReceived = false;
            if (!locationReceived) {
                this.switchHotSpot.setEnabled(true);
                this.switchBluetooth.setEnabled(true);
            }
        }
    }

    @Override
    public void onBluetoothDataUpdate(BluetoothData bluetoothData) {
        JSONObject jsonObject = new JSONObject();
        long currentTime = System.currentTimeMillis();
        long timespan = currentTime - lastTime;

        // list viw
        HashMap<String, String> timeEntry = new HashMap<String, String>();
        DecimalFormat df = new DecimalFormat("#0.00");
        timeEntry.put(this.from[0], " --- " + ++fullScanCounter + ". --- " + df.format((double) timespan / 1000) + " sec. ---");
        this.bluetoothList.add(timeEntry);

        // object to send
        try {
            JSONArray jsonDeviceList = new JSONArray();
            for (BluetoothData.BluetoothScan scan : bluetoothData.getData()) {
                HashMap<String, String> listEntry = new HashMap<String, String>();
                JSONObject jsonDevice = new JSONObject();
                jsonDevice.put("time", scan.getTime().getTimeInMillis());
                jsonDevice.put("bluetoothId", scan.getDevice().getAddress());
                jsonDevice.put("bluetoothClass", scan.getDevice().getBluetoothClass().getDeviceClass());
                jsonDeviceList.put(jsonDevice);
                if (scan.getDevice().getName() != null) {
                    listEntry.put(this.from[0], ++this.scanCounter + ". "
                            + scan.getDevice().getName() + "..."
                            + " (" + scan.getDevice().getAddress() + ") "
                            + df.format((double) (scan.getTime().getTimeInMillis() - lastTime) / 1000) + " sec.");
                } else {
                    listEntry.put(this.from[0], ++this.scanCounter + ". "
                            + "unknown " + "(" + scan.getDevice().getAddress() + ") "
                            + df.format((double) (scan.getTime().getTimeInMillis() - lastTime) / 1000) + " sec.");
                }
                this.bluetoothList.add(listEntry);
            }
            jsonObject.put("scanResult", jsonDeviceList);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        this.lastTime = currentTime;

        this.bluetoothListAdapter.notifyDataSetChanged();

        if (this.ready) {
            this.notifyDBEntryObservers(
                    new TransmissionData(
                            TransmissionData.Method.PUT,
                            TransmissionData.Interface.PUSH_BLUETOOTH_DATA + Global.getMacAddress(),
                            TransmissionData.PostFuntionType.SEND_BLUETOOTH_DATA,
                            jsonObject));
        }
    }

    @Override
    public void onHotspotDataUpdate(HotspotData hotspotData) {
        if (this.ready) {

            if (hotspotData.getData()) {
            /*
             * Add hotspot sensor
             */
                JSONObject jsonObject = new JSONObject();
                try {
                    jsonObject.put("lat", SensorFragment.this.location.getLatitude());
                    jsonObject.put("lng", SensorFragment.this.location.getLongitude());
                    jsonObject.put("ssid", this.hotSpotName);
                    jsonObject.put("bssid", Global.getMacAddress());
                    jsonObject.put("typeId", GREMO_WIFI_SENSOR);
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                TransmissionData data = new TransmissionData(TransmissionData.Method.POST, TransmissionData.Interface.ADD_WIFI, TransmissionData.PostFuntionType.CREATE_WIFI_SENSOR, jsonObject);
                SensorFragment.this.notifyDBEntryObservers(data);
            } else {
                // Hotspot disabled
            }
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

    @Override
    public void onStop() {
        super.onStop();
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Override
    public void onResume() {
        super.onResume();
    }
}