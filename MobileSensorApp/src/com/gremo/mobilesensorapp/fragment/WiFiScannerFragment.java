package com.gremo.mobilesensorapp.fragment;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.location.Location;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.ListView;
import android.widget.SimpleAdapter;
import android.widget.Toast;

import com.gremo.mobilesensorapp.Global;
import com.gremo.mobilesensorapp.R;
import com.gremo.mobilesensorapp.model.LocationData;
import com.gremo.mobilesensorapp.model.LocationSensor;
import com.gremo.mobilesensorapp.model.TransmissionData;
import com.gremo.mobilesensorapp.model.WifiData;
import com.gremo.mobilesensorapp.model.WifiSensor;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class WiFiScannerFragment extends Fragment implements LocationData.Observer, WifiData.Observer, TransmissionData.Provider {
    private ArrayList<TransmissionData.Observer> observers = new ArrayList<TransmissionData.Observer>();

    private final String[] from = new String[]{"SSID", "BSSID"};
    private final int[] to = new int[]{R.id.item1, R.id.item2};

    private final List<Map<String, String>> wifiList = new ArrayList<Map<String, String>>();

    private WifiSensor wifiSensor;

    private SimpleAdapter adapter;

    private ListView wifiListView;
    private Location location;

    private Button buttonScan;
    private Button buttonSendAll;

    private static final int TAGGED_WIFI_ROUTER = 2;
    private boolean ready = false;

    public WiFiScannerFragment() {
        super();

        LocationSensor locationSensor = LocationSensor.getInstance();
        locationSensor.registerLocationObserver(this);

        this.wifiSensor = WifiSensor.getInstance();
        this.wifiSensor.registerWifiDataObserver(this);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_wifiscanner, container, false);

        this.buttonScan = ((Button) rootView.findViewById(R.id.switchWiFiScanner));
        this.buttonScan.setEnabled(false);
        this.buttonScan.setOnClickListener(new CompoundButton.OnClickListener() {
            @Override
            public void onClick(View arg0) {
                WiFiScannerFragment.this.wifiList.clear();
                WiFiScannerFragment.this.wifiListView.setAdapter(adapter);
                WiFiScannerFragment.this.wifiSensor.senseOnce();
                WiFiScannerFragment.this.buttonSendAll.setEnabled(true);
            }
        });

        this.buttonSendAll = (Button) rootView.findViewById(R.id.switchSendAll);
        this.buttonSendAll.setEnabled(false);
        this.buttonSendAll.setOnClickListener(new CompoundButton.OnClickListener() {
            @Override
            public void onClick(View arg0) {
                Iterator<Map<String, String>> iterator = wifiList.iterator();
                while (iterator.hasNext()) {
                    Map<String, String> item = iterator.next();
                    TransmissionData data = WiFiScannerFragment.this.composeWifiSensorDBEntry(item.get(from[0]), item.get(from[1]));
                    WiFiScannerFragment.this.notifyDBEntryObservers(data);
                }
            }
        });

        this.adapter = new SimpleAdapter(Global.getMainActivity(), this.wifiList, R.layout.wifi_item, this.from, this.to);

        this.wifiListView = (ListView) rootView.findViewById(R.id.listViewBluetooth);
        this.wifiListView.setAdapter(this.adapter);
        this.wifiListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            public void onItemClick(AdapterView<?> parentAdapter, View view, int position, long id) {
                openPreSendDialog(WiFiScannerFragment.this.wifiList.get(position));
            }
        });

        this.ready = true;

        return rootView;
    }

    private void openPreSendDialog(Map<String, String> item) {
        // Extract data from clicked item
        final String ssid = item.get(from[0]);
        final String bssid = item.get(from[1]);

        /*
         * Build AlertDialog
         */
        AlertDialog.Builder builder = new AlertDialog.Builder(Global.getMainActivity());
        builder.setCancelable(true);
        builder.setTitle("Send WiFi Hotspot " + ssid + "?");
        builder.setMessage("Latitude: "
                + location.getLatitude() + "\n"
                + "Longitude: " + location.getLongitude());
        builder.setInverseBackgroundForced(true);
        builder.setPositiveButton("Yes",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Toast.makeText(Global.getMainActivity(),
                                "sending Hotspot ...",
                                Toast.LENGTH_SHORT).show();

                        TransmissionData data = WiFiScannerFragment.this.composeWifiSensorDBEntry(ssid, bssid);
                        WiFiScannerFragment.this.notifyDBEntryObservers(data);
                        dialog.dismiss();
                    }
                });


        builder.setNegativeButton("No",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog,
                                        int which) {
                        dialog.dismiss();
                    }
                });

        builder.create()
                .show();
    }

    private TransmissionData composeWifiSensorDBEntry(String ssid, String bssid) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("lat", this.location.getLatitude());
            jsonObject.put("lng", this.location.getLongitude());
            jsonObject.put("ssid", ssid);
            jsonObject.put("bssid", bssid);
            jsonObject.put("time", this.location.getTime());
            jsonObject.put("typeId", TAGGED_WIFI_ROUTER);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return new TransmissionData(TransmissionData.Method.POST, TransmissionData.Interface.ADD_WIFI, TransmissionData.PostFuntionType.CREATE_WIFI_SENSOR, jsonObject);
    }

    @Override
    public void onStop() {
        super.onStop();
        wifiSensor.disable();
    }

    @Override
    public void onPause() {
        super.onPause();
        wifiSensor.disable();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        wifiSensor.disable();
    }

    @Override
    public void onResume() {
        super.onResume();
    }

    @Override
    public void onLocationUpdate(LocationData location) {
        if (ready) {
            this.location = location.getData();
            WiFiScannerFragment.this.buttonScan.setEnabled(true);
        }
    }

    @Override
    public void onWifiDataUpdate(WifiData wifiData) {
        if (ready) {
            this.wifiList.add(wifiData.getData());
            adapter.notifyDataSetChanged();
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
}