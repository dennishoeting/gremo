package com.gremo.mobilesensorapp.fragment;

import android.location.Location;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.UiSettings;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.gremo.mobilesensorapp.Global;
import com.gremo.mobilesensorapp.R;
import com.gremo.mobilesensorapp.model.LocationData;
import com.gremo.mobilesensorapp.model.LocationSensor;

import java.util.Date;

public class MapFragment extends SupportMapFragment implements LocationData.Observer {
    private final LocationSensor locationSensor;
    private MarkerOptions markerOptions;
    private Marker marker;
    private GoogleMap map;
    private boolean ready = false;
    private boolean locationReceived = false;
    private boolean userBased = false;

    public MapFragment() {
        super();

        this.locationSensor = LocationSensor.getInstance();
        this.locationSensor.registerLocationObserver(this);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        super.onCreateView(inflater, container, savedInstanceState);

        View rootView = inflater.inflate(R.layout.fragment_map, container, false);

        Button buttonOnce = (Button) rootView.findViewById(R.id.buttonLocation);
        buttonOnce.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                MapFragment.this.userBased = false;
                MapFragment.this.locationSensor.senseOnce();
            }
        });

        this.markerOptions = new MarkerOptions();
        this.map = ((SupportMapFragment) Global.getMainActivity()
                .getSupportFragmentManager()
                .findFragmentById(R.id.map))
                .getMap();

        this.map.setOnMarkerDragListener(new GoogleMap.OnMarkerDragListener() {
            @Override
            public void onMarkerDragStart(Marker marker) {
                MapFragment.this.userBased = true;
                MapFragment.this.locationSensor.disable();
            }

            @Override
            public void onMarkerDrag(Marker marker) {
            }

            @Override
            public void onMarkerDragEnd(Marker marker) {
                Location location = new Location("Marker Location");
                location.setLatitude(marker.getPosition().latitude);
                location.setLongitude(marker.getPosition().longitude);
                location.setProvider("Marker");
                location.setTime(new Date().getTime()); //Set time as current Date
                MapFragment.this.locationSensor.notifyLocationObservers(new LocationData(location));
            }
        });

        this.initMap();

        this.ready = true;
        return rootView;
    }

    private void initMap() {
        Log.d("initMap", "init Map");
        UiSettings settings = getMap().getUiSettings();
        settings.setAllGesturesEnabled(false);
        settings.setMyLocationButtonEnabled(true);

        /*FragmentTransaction ft = Global.getMainActivity().getSupportFragmentManager()
                .beginTransaction();
        ft.show(Global.getMainActivity().getSupportFragmentManager()
                .findFragmentById(R.id.map));
        ft.commit();*/
    }

    @Override
    public void onLocationUpdate(LocationData location) {

        if (ready && !userBased) {
            Location location1 = location.getData();

            if (!this.locationReceived) {
                this.locationReceived = true;
                this.marker = this.map.addMarker(this.markerOptions
                        .position(new LatLng(location1.getLatitude(), location1.getLongitude()))
                        .title(getResources().getString(R.string.SensorMapMarker))
                        .snippet(location.toString())
                        .draggable(true)
                        .icon(BitmapDescriptorFactory.fromResource(R.drawable.sensor_icon)));
                this.map.moveCamera(
                        CameraUpdateFactory.newLatLngZoom(
                                new LatLng(location1.getLatitude(), location1.getLongitude()),
                                16));
            } else {
                this.marker.setPosition(new LatLng(location1.getLatitude(), location1.getLongitude()));
            }

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