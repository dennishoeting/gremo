package com.gremo.mobilesensorapp.fragment;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.os.Environment;
import android.os.PowerManager;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.ListView;
import android.widget.SimpleAdapter;
import android.widget.Switch;

import com.gremo.mobilesensorapp.Global;
import com.gremo.mobilesensorapp.R;
import com.gremo.mobilesensorapp.controller.DatabaseController;
import com.gremo.mobilesensorapp.controller.SendDataScheduler;
import com.gremo.mobilesensorapp.model.DBEvent;
import com.gremo.mobilesensorapp.model.TransmissionData;

import org.json.JSONException;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.channels.FileChannel;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DBFragment extends Fragment implements DBEvent.Observer {

    private final String[] from = new String[]{"ID", "METHOD", "URL", "DATA", "POSTFUNC", "TIMESTAMP"};
    private final int[] to = new int[]{R.id.dbId, R.id.dbMethod, R.id.dbUrl, R.id.dbData, R.id.dbPostFunc, R.id.dbTimestamp};
    private final List<Map<String, String>> dbList = new ArrayList<Map<String, String>>();
    PowerManager powerManager;
    private SimpleAdapter adapter;
    private DatabaseController dbController = DatabaseController.getInstance();
    private PowerManager.WakeLock wakeLock;
    private Switch switchSending;
    private Switch switchWakeLock;
    private Button saveDBButton;
    private WifiManager wifiManager;
    private WifiManager.WifiLock wifiLock;

    public DBFragment() {
        super();

        this.dbController.registerDBEventObserver(this);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_database, container, false);

        this.wifiManager = (WifiManager) Global.getMainActivity().getSystemService(Context.WIFI_SERVICE);
        this.wifiLock = this.wifiManager.createWifiLock("Gremo wifilock");


        this.powerManager = (PowerManager) Global.getMainActivity().getSystemService(Context.POWER_SERVICE);
        this.wakeLock = powerManager.newWakeLock(
                powerManager.PARTIAL_WAKE_LOCK, "Gremo wakelook");


        this.switchSending = (Switch) rootView.findViewById(R.id.switchSending);
        this.switchSending.setChecked(false);
        this.switchSending.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {

            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean isChecked) {
                if (isChecked) {
                    SendDataScheduler.getInstance().enable();
                } else {
                    SendDataScheduler.getInstance().disable();
                }
            }
        });

        this.switchWakeLock = (Switch) rootView.findViewById(R.id.switchWakeLock);
        this.switchWakeLock.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {

            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean isChecked) {
                if (isChecked) {
                    DBFragment.this.wakeLock.acquire();
                    //    DBFragment.this.wifiLock.acquire();
                } else {
                    DBFragment.this.wakeLock.release();
                    // DBFragment.this.wifiLock.release();
                }
            }
        });

        this.saveDBButton = (Button) rootView.findViewById(R.id.buttonSaveDB);
        this.saveDBButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    File sd = Environment.getExternalStorageDirectory();
                    File data = Environment.getDataDirectory();

                    if (sd.canWrite()) {
                        DateFormat formatter = new SimpleDateFormat("dd-MM-yyyy_HH-mm-ss");
                        String date = formatter.format(new Date().getTime());
                        String currentDBPath = "/data/com.gremo.mobilesensorapp/databases/data.db";
                        String backupDBPath = "/GremoCrash/dbbackup_" + date + ".db";
                        File currentDB = new File(data, currentDBPath);
                        File backupDB = new File(sd, backupDBPath);

                        if (currentDB.exists()) {
                            FileChannel src = new FileInputStream(currentDB).getChannel();
                            FileChannel dst = new FileOutputStream(backupDB).getChannel();
                            dst.transferFrom(src, 0, src.size());
                            src.close();
                            dst.close();
                        }
                    }
                } catch (Exception e) {
                }
            }
        });

        this.adapter = new SimpleAdapter(Global.getMainActivity(), this.dbList, R.layout.db_item, this.from, this.to);
        ListView dbListView = (ListView) rootView.findViewById(R.id.listViewDB);
        dbListView.setAdapter(adapter);

        this.refreshList();

        return rootView;
    }

    private void refreshList() {
        try {
            DBFragment.this.dbList.clear();
            for (TransmissionData transmissionData : dbController.getAllDataObjects()) {
                Map<String, String> map = new HashMap<String, String>();
                map.put(DBFragment.this.from[0], "" + transmissionData.getIds());
                map.put(DBFragment.this.from[1], transmissionData.getMethodString());
                map.put(DBFragment.this.from[2], transmissionData.getPath());
                map.put(DBFragment.this.from[3], transmissionData.getData().toString());
                map.put(DBFragment.this.from[4], transmissionData.getPostFuntionTypeString());
                map.put(DBFragment.this.from[5], new SimpleDateFormat("dd.MM.yy HH:mm").format(transmissionData.getTimestamp()));
                DBFragment.this.dbList.add(map);
            }
            adapter.notifyDataSetChanged();
        } catch (JSONException e) {
            e.printStackTrace();
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

    @Override
    public void onDBEventUpdate(DBEvent data) {
        switch (data.getType()) {
            case CREATED:
                Map<String, String> map = new HashMap<String, String>();
                map.put(DBFragment.this.from[0], "" + data.getData().getIds());
                map.put(DBFragment.this.from[1], data.getData().getMethodString());
                map.put(DBFragment.this.from[2], data.getData().getPath());
                map.put(DBFragment.this.from[3], data.getData().getData().toString());
                map.put(DBFragment.this.from[4], data.getData().getPostFuntionTypeString());
                map.put(DBFragment.this.from[5], new SimpleDateFormat("dd.MM.yy HH:mm").format(data.getData().getTimestamp()));
                this.dbList.add(map);
                adapter.notifyDataSetChanged();
                break;
            case DELETED:
                dbListLoop:
                for (Map<String, String> entry : this.dbList) {
                    for (int i = 0; i < data.getData().getIds().size(); i++) {
                        if (entry.get("ID").equals("[" + data.getData().getIds().get(i) + "]")) {
                            this.dbList.remove(entry);
                            adapter.notifyDataSetChanged();
                            break dbListLoop;
                        }
                    }
                }
                break;
        }
    }
}