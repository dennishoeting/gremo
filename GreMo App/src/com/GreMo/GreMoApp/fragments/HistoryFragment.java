package com.GreMo.GreMoApp.fragments;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ListView;
import android.widget.SimpleAdapter;
import android.widget.Toast;

import com.GreMo.GreMoApp.Global;
import com.GreMo.GreMoApp.R;
import com.GreMo.GreMoApp.controller.DatabaseController;
import com.GreMo.GreMoApp.controller.SendDataTask;
import com.GreMo.GreMoApp.model.HTTPResult;
import com.GreMo.GreMoApp.model.TransmissionData;
import com.google.analytics.tracking.android.GoogleAnalytics;
import com.google.analytics.tracking.android.Tracker;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * fragment for the history page
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class HistoryFragment extends Fragment {

    // movement type
    private static final String MOVEMENT_TYPE_ID_UNKNOWN = "Unkown";
    private static final String MOVEMENT_TYPE_ID_WALKING = "Walking";
    private static final String MOVEMENT_TYPE_ID_BIKING = "Biking";
    private final String[] from = new String[]{"ID", "DATE", "ACTION", "DISTANCE", "POINTS"};
    private final int[] to = new int[]{R.id.history_id, R.id.history_date, R.id.history_action, R.id.history_distance, R.id.history_points};
    private final List<Map<String, String>> historyList = new ArrayList<Map<String, String>>();
    private final DatabaseController databaseController;
    private SimpleAdapter adapter;
    private ListView historyListView;
    private Button refreshButton;
    private View rootView;
    private Tracker mGaTracker;
    private GoogleAnalytics mGaInstance;

    public HistoryFragment() {
        super();
        this.databaseController = DatabaseController.getInstance();
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
        this.rootView = inflater.inflate(R.layout.fragment_history, container, false);

        this.mGaInstance = GoogleAnalytics.getInstance(Global.getMainActivity());
        this.mGaTracker = mGaInstance.getTracker("UA-43209279-1");

        this.refreshButton = (Button) this.rootView.findViewById(R.id.buttonRefreshHistory);
        this.refreshButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(Global.getMainActivity(), getString(R.string.updatingHistory), Toast.LENGTH_SHORT).show();
                HistoryFragment.this.mGaTracker.sendEvent("ui_action", "button_press", "history_refresh_button", 1L);
                HistoryFragment.this.refreshList();
            }
        });

        this.adapter = new SimpleAdapter(Global.getMainActivity(), this.historyList, R.layout.history_item, this.from, this.to);

        this.historyListView = (ListView) this.rootView.findViewById(R.id.listViewHistory);
        this.historyListView.setAdapter(adapter);

        this.refreshList();

        return this.rootView;
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
     * refreshes the history list, sends an request to the server and updated the view on response
     */
    private void refreshList() {
        // clear the list

        this.historyList.clear();
        // creates TransmissionData object and sends it to the server
        SendDataTask task = new SendDataTask(
                new TransmissionData(
                        TransmissionData.Method.GET,
                        TransmissionData.Interface.GET_ACTION_LIST
                                .replace(":userId", Global.getUserId() + "") + "?limit=10&offset=0",
                        TransmissionData.PostFuntionType.ACTIONLIST_RETRIEVED,
                        new JSONObject()));
        task.registerHTTPResultObserver(new HTTPResult.Observer() {
            /**
             * if the request was successful updates the view
             *
             * @param data the returned data
             */
            @Override
            public void onHTTPResultUpdate(HTTPResult data) {
                if (!data.isException()) {
                    try {
                        JSONObject body = new JSONObject(data.getResponseBodyString());
                        JSONArray list = (JSONArray) body.get("list");
                        for (int i = 0; i < list.length(); i++) {
                            Map<String, String> entry = new HashMap<String, String>();
                            JSONObject entryJson = (JSONObject) list.get(i);
                            String id = entryJson.get("id").toString();
                            String date = new SimpleDateFormat("dd.MM.yy HH:mm")
                                    .format(new Date(Long.parseLong(entryJson.get("date").toString())));
                            int type = (Integer) (entryJson.get("actionType"));
                            Double points = (Double.parseDouble(entryJson.get("pointsearned").toString()));
                            Double distance = (Double.parseDouble(entryJson.get("distance").toString()));

                            entry.put(HistoryFragment.this.from[0], id);
                            entry.put(HistoryFragment.this.from[1], date);
                            switch (type) {
                                case 2:
                                    entry.put(HistoryFragment.this.from[2], MOVEMENT_TYPE_ID_WALKING);
                                    break;
                                case 3:
                                    entry.put(HistoryFragment.this.from[2], MOVEMENT_TYPE_ID_BIKING);
                                    break;
                                default:
                                    entry.put(HistoryFragment.this.from[2], MOVEMENT_TYPE_ID_UNKNOWN);
                                    break;
                            }
                            DecimalFormat decimalFormat = new DecimalFormat(",###");
                            entry.put(HistoryFragment.this.from[3], decimalFormat.format(distance));
                            entry.put(HistoryFragment.this.from[4], decimalFormat.format(points));
                            HistoryFragment.this.historyList.add(entry);
                        }
                        Toast.makeText(Global.getMainActivity(), getString(R.string.updatedHistory), Toast.LENGTH_SHORT).show();
                        HistoryFragment.this.adapter.notifyDataSetChanged();

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        task.execute();
    }
}